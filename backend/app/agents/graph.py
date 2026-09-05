import os
from typing import TypedDict, List
from langgraph.graph import StateGraph, END
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from app.services.anomaly import compute_stylometric_deviation
from app.services.breeth import BreethMemoryClient

# State definition across nodes
class AgentState(TypedDict):
    student_id: str
    student_name: str
    raw_text: str
    current_metrics: dict
    baseline_metrics: List[dict]
    deviation_score: float
    is_flagged: bool
    extracted_claims: List[str]
    socratic_questions: List[str]

# 1. Forensic Node: Evaluates stylometric shifts against Breeth & DB records
async def forensic_anomaly_node(state: AgentState) -> dict:
    breeth_client = BreethMemoryClient()
    # Query Breeth memory profile for longitudinal context
    profile = await breeth_client.get_cognitive_profile(state["student_id"])
    
    score, is_flagged = compute_stylometric_deviation(
        state["baseline_metrics"], 
        state["current_metrics"]
    )
    return {"deviation_score": score, "is_flagged": is_flagged}

# 2. Cognitive Claim Extraction Node: Pulls complex claims for the interview
async def cognitive_claim_node(state: AgentState) -> dict:
    llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.2)
    
    prompt = f"""
    You are an academic forensic examiner evaluating an essay for potential ghostwriting or generative paraphrasing.
    Read the submitted document below and extract 2 distinct, highly complex claims, arguments, or domain assertions 
    that a student who did not write the paper would struggle to defend under interrogation.
    
    Document:
    {state['raw_text'][:4000]}
    
    Respond ONLY with a JSON array of strings containing the 2 claims.
    """
    response = await llm.ainvoke([HumanMessage(content=prompt)])
    
    import json
    try:
        claims = json.loads(response.content.replace("```json", "").replace("```", "").strip())
    except Exception:
        claims = ["Core thematic analysis in section 2", "Primary methodological deduction"]
        
    return {"extracted_claims": claims}

# 3. Socratic Question Generation Node: Generates interrogation prompts
async def socratic_generation_node(state: AgentState) -> dict:
    llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.3)
    claims_str = "\n".join(f"- {c}" for c in state["extracted_claims"])
    
    prompt = f"""
    Based on these complex claims from the student's paper:
    {claims_str}
    
    Generate 2 targeted Socratic questions for student {state['student_name']}.
    The questions must probe their personal comprehension, deductive reasoning, and methodology 
    without revealing or quoting the answer directly.
    
    Return ONLY a JSON list of 2 question strings.
    """
    response = await llm.ainvoke([HumanMessage(content=prompt)])
    import json
    try:
        questions = json.loads(response.content.replace("```json", "").replace("```", "").strip())
    except Exception:
        questions = ["Can you elaborate on the logical deduction in your second paragraph?"]
        
    return {"socratic_questions": questions}

# Conditional routing
def route_audit(state: AgentState):
    return "flagged" if state["is_flagged"] else "verified"

# Build the Graph
workflow = StateGraph(AgentState)

workflow.add_node("forensic_check", forensic_anomaly_node)
workflow.add_node("extract_claims", cognitive_claim_node)
workflow.add_node("generate_socratic", socratic_generation_node)

workflow.set_entry_point("forensic_check")

workflow.add_conditional_edges(
    "forensic_check",
    route_audit,
    {
        "flagged": "extract_claims",
        "verified": END,
    }
)
workflow.add_edge("extract_claims", "generate_socratic")
workflow.add_edge("generate_socratic", END)

audit_agent = workflow.compile()
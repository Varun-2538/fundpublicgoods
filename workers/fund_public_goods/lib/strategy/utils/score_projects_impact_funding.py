from fund_public_goods.db.entities import Projects
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers.json import JsonOutputParser
from fund_public_goods.lib.strategy.models.project_scores import ProjectImpactFundingScores, ProjectScores


score_projects_prompt_template = """
As an agent tasked with numerically scoring public goods projects, you will use the evaluator's reports to rate each project on the following criteria:

- Impact: Rate the project's demonstrated impact based on concrete, verifiable achievements from 0 to 1 using 2 decimals.
A score of 0 suggests no proven impact, while 1 indicates significant, well-documented contributions.
Focus on the evidence of past outcomes, the scale of these achievements, and the consistency of reported success.

- Funding Needs: Assess the project's funding needs and efficiency of current fund use from 0 to 1 using 2 decimals.
A score of 0 means the funding needs are not justified or are poorly aligned with project goals, while a score of 1 indicates a clear,
well-substantiated need for funds that directly supports the project's objectives and maximizes impact.

For each criterion, provide a brief justification for your score,
referencing specific aspects of the evaluator's report that influenced your decision.
Your goal is to offer a quantitative assessment that reflects a comprehensive and critical analysis of the project's impact, and its funding needs.

You will return a single JSON object:

{{
    project_id: str,
    impact: float,
    funding_needed: float
}}

Do not include any other contents in your response. Always use snake case. All fields are required

Project report:

{report}
"""

def score_projects_impact_funding(projects_with_report: list[Projects]) -> list[ProjectImpactFundingScores]:
    reports = [f"Project ID: {project.id}\n\n{project.impact_funding_report}" for project in projects_with_report]
    
    score_projects_prompt = ChatPromptTemplate.from_messages([
        ("system", score_projects_prompt_template),
    ])
    
    llm = ChatOpenAI(model="gpt-4-turbo", temperature=0, model_kwargs={'seed': 10}) # type: ignore
    
    scoring_chain = score_projects_prompt | llm | JsonOutputParser()
    
    raw_scored_projects = scoring_chain.batch([{
        "report": report
    } for report in reports ])
    
    scored_projects: list[ProjectImpactFundingScores] = []
    for raw_scored_project in raw_scored_projects:
        scored_project = ProjectImpactFundingScores(**raw_scored_project)
        scored_projects.append(scored_project)
    
    return scored_projects
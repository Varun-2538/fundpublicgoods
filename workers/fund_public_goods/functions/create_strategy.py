import json
from fund_public_goods.agents.researcher.functions.evaluate_projects import evaluate_projects
from fund_public_goods.agents.researcher.models.evaluated_project import EvaluatedProject
from fund_public_goods.agents.researcher.models.project import Project
from fund_public_goods.agents.researcher.models.answer import Answer
from fund_public_goods.agents.researcher.models.weighted_project import WeightedProject
import inngest
import datetime
from fund_public_goods.events import CreateStrategyEvent
from fund_public_goods.db import client, logs, projects, strategy_entries
from supabase import Client


def fetch_projects_data(supabase: Client):
    response = supabase.table("gitcoin_projects").select("id, data, protocol, gitcoin_applications(id, data)").execute()
    projects = []

    for item in response.data:
        project_data = item.get('data', {})
        project_id = item.get('id', '')

        answers = []
        for app in item.get('gitcoinApplications', []):
            app_data = app.get('data', {}).get('application', {})
            for ans in app_data.get('answers', []):
                answer = {
                    "question": ans.get('question', ''),
                    "answer": ans.get('answer', None)
                }
                answers.append(answer)

        project = {
            "id": project_id,
            "title": project_data.get('title', ''),
            "recipient": project_data.get('recipient', ''),
            "description": project_data.get('description', ''),
            "website": project_data.get('website', ''),
            "answers": answers
        }
        projects.append(project)

    return projects


def extract_prompt(supabase: Client, run_id: str):
    return supabase.table('runs').select("prompt").eq("id", run_id).limit(1).single().execute().data


@inngest.create_function(
    fn_id="on_create_strategy",
    trigger=CreateStrategyEvent.trigger,
)
async def create_strategy(
    ctx: inngest.Context,
    step: inngest.Step,
) -> str | None:
    data = CreateStrategyEvent.Data.model_validate(ctx.event.data)
    run_id = data.run_id
    supabase = client.create_admin()
    
    await step.run(
        "extracting_prompt",
        lambda: logs.insert(
            supabase,
            run_id,
            "Extracting prompt from run_id"
        ),
    )
    
    prompt = await step.run(
        "extract_prompt",
        lambda: extract_prompt(supabase, run_id)
    )
    
    print(prompt)

    await step.run(
        "getting_info",
        lambda: logs.insert(
            supabase,
            run_id,
            "Getting information from data sources"
        ),
    )

    json_projects = await step.run(
        "fetch_projects_data",
        lambda: fetch_projects_data(supabase)
    )
    
    projects: list[Project] = [Project(**json_project) for json_project in json_projects]

    await step.run(
        "assessing",
        lambda: logs.insert(
            supabase,
            run_id,
            "Assessing impact of each project realted to the users interest",
        ),
    )
    
    json_asessed_projects = await step.run(
        "evaluate_projects",
        lambda: evaluate_projects(prompt, projects)
    )
    
    # assessed_projects = [EvaluatedProject(**x) for x in json_asessed_projects]
    
    print(json_asessed_projects)

    # await step.run(
    #     "determine",
    #     lambda: logs.insert(
    #         supabase,
    #         run_id,
    #         "Determining the relative funding that the best matching projects need",
    #     ),
    # )
    
    # weighted_projects: list[WeightedProject] = await step.run(
    #     "fetch_projects_data",
    #     lambda: generate_strategy(supabase, run_id)
    # )

    # await step.run("result", lambda: logs.insert(
    #     supabase,
    #     run_id,
    #     "Generating results"
    # ))

    # await step.run("result", lambda: logs.insert(
    #     supabase,
    #     run_id,
    #     "STRATEGY_CREATED"
    # ))
    
    return json.dumps([x.model_dump() for x in json_asessed_projects])

    # return json.dumps([x.model_dump() for x in weighted_projects])

import inngest
from pydantic import BaseModel

class CreateStrategyEvent:
    name: str = "CreateStrategy"
    trigger = inngest.TriggerEvent(event=name)

    class Data(BaseModel):
        prompt: str
        worker_id: str

        def to_event(self, ts: int = 0):
            return inngest.Event(name=CreateStrategyEvent.name, data=self.model_dump(), ts=ts)
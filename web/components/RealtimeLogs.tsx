"use client";

import clsx from "clsx";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Tables } from "@/supabase/dbTypes";
import { createSupabaseBrowserClient } from "@/utils/supabase-browser";
import LoadingCircle from "@/components/LoadingCircle";
import ProgressBar from "@/components/ProgressBar";
import useSession from "@/hooks/useSession";
import {
  UNSTARTED_TEXTS,
  LOADING_TEXTS,
  STEPS_ORDER,
  STEP_TIME_ESTS,
} from "@/utils/logs";
import { Transition } from "@headlessui/react";

const getLogMessage = (log: Tables<"logs">) => {
  switch (log.status) {
    case "NOT_STARTED":
      return UNSTARTED_TEXTS[log.step_name];
    case "IN_PROGRESS":
      return LOADING_TEXTS[log.step_name];
    case "COMPLETED":
      return log.value ?? `Completed: ${UNSTARTED_TEXTS[log.step_name]}`;
    case "ERRORED":
      return `Error while ${LOADING_TEXTS[log.step_name].toLowerCase()}`;
  }
};

export default function RealtimeLogs(props: {
  logs: Tables<"logs">[];
  run: {
    id: string;
    prompt: string;
  };
}) {
  const { data: session } = useSession();
  const supabase = createSupabaseBrowserClient(
    session?.supabaseAccessToken ?? ""
  );
  const router = useRouter();

  const sortedLogsWithSteps = props.logs.sort((a, b) => {
    return STEPS_ORDER[a.step_name] - STEPS_ORDER[b.step_name];
  });

  useEffect(() => {
    const channel = supabase
      .channel("logs-added")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          table: "logs",
          schema: "public",
          filter: `run_id=eq.${props.run.id}`,
        },
        () => {
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, props.run.id]);

  const totalSteps = sortedLogsWithSteps.length;
  const stepTimes = sortedLogsWithSteps.map((x) => STEP_TIME_ESTS[x.step_name]);
  let currentStep = sortedLogsWithSteps.findIndex(
    (x) => x.status === "IN_PROGRESS"
  );

  if (currentStep < 0) {
    const lastStep = sortedLogsWithSteps[totalSteps - 1];
    if (!!lastStep) {
      currentStep = lastStep.status === "COMPLETED" ? totalSteps + 1 : 0;
    } else {
      currentStep = 0;
    }
  }

  return (
    <>
      <div className='space-y-2'>
        <ProgressBar
          stepTimes={stepTimes}
          curStep={currentStep}
          className={"!stroke-indigo-500 text-indigo-200 rounded-lg"}
        />
        {sortedLogsWithSteps.map((log) => (
          <>
            <Transition
              key={log.id}
              show={log.status === "IN_PROGRESS" || log.status === "COMPLETED"}
              enter='transition-opacity duration-75'
              enterFrom='opacity-0'
              enterTo='opacity-100'
              leave='transition-opacity duration-150'
              leaveFrom='opacity-100'
              leaveTo='opacity-0'>
              {log.status === "IN_PROGRESS" ? (
                <div className='flex items-center space-x-2' key={log.id}>
                  <LoadingCircle
                    hideText={true}
                    className='!stroke-indigo-500 text-indigo-200'
                  />
                  <p className='text-xs leading-tight text-indigo-500'>
                    {getLogMessage(log)}
                  </p>
                </div>
              ) : log.status === "COMPLETED" ? (
                <div className='flex items-center space-x-2' key={log.id}>
                  <div
                    className='text-sm px-0.5 h-4 flex items-center'
                    role='img'
                    aria-label='check mark symbol'>
                    ✅
                  </div>
                  <div className='text-xs leading-tight text-green-600'>
                    {getLogMessage(log)}
                  </div>
                </div>
              ) : (
                <></>
              )}
            </Transition>
          </>
        ))}
      </div>
    </>
  );
}

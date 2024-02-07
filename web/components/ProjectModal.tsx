import {
  ArrowSquareOut,
  CaretDown,
  GlobeSimple,
  TwitterLogo,
} from "@phosphor-icons/react/dist/ssr";
import Modal, { ModalProps } from "./ModalBase";
import Score from "./Score";
import { StrategyInformation } from "./StrategyTable";
import ReactMarkdown from "react-markdown";
import { ReactNode, useState } from "react";
import clsx from "clsx";
import { SparkleIcon } from "./Icons";
import Image from "next/image";

export type ProjectModalProps = ModalProps & {
  strategy?: StrategyInformation;
};

const ProjectModalTitle = ({
  title,
  strategy,
}: {
  title: string | ReactNode;
  strategy?: StrategyInformation;
}) => {
  return (
    <div className='flex space-x-2 items-center'>
      {strategy?.project.logo ? (
        <Image
          className='rounded-full border-2 border-indigo-300 object-fit'
          width={40}
          height={40}
          alt='logo'
          src={`https://ipfs.io/ipfs/${strategy?.project.logo}`}
        />
      ) : (
        <div className='w-10 h-10 rounded-full flex items-center justify-center bg-indigo-100 border-2 border-indigo-300'>
          <SparkleIcon size={24} className='opacity-80' />
        </div>
      )}
      <div className='space-y-1.5'>
        <h3 className='text-base font-bold leading-none text-indigo-800'>
          {title}
        </h3>
        {strategy && (
          <div className='space-x-2 flex'>
            {strategy.project.website && (
              <a
                href={strategy.project.website || "#"}
                target='_blank'
                rel='noredirect'>
                <GlobeSimple size={16} />
              </a>
            )}
            {strategy.project.twitter && (
              <a
                href={strategy.project.twitter || "#"}
                target='_blank'
                rel='noredirect'>
                <TwitterLogo size={16} />
              </a>
            )}
            {/* 
              TODO: Once we have added github into the projects table
              we would uncomment this
              <a
                href="#"
                target='_blank'
                rel='noredirect'>
                <GithubLogo size={16} />
              </a>
            */}
          </div>
        )}
      </div>
    </div>
  );
};

const ProjectModal = ({
  isOpen,
  title,
  onClose,
  strategy,
}: ProjectModalProps) => {
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [scoreExpanded, setScoreExpanded] = useState(false);
  const [reportExpanded, setReportExpanded] = useState(false);

  return (
    <Modal
      isOpen={isOpen}
      title={<ProjectModalTitle title={title} strategy={strategy} />}
      onClose={onClose}
      contentStyles={{ padding: "p-6 pt-0" }}>
      {strategy && (
        <div className='space-y-4'>
          <div className='bg-indigo-50 p-3 rounded-xl space-y-3'>
            <div
              onClick={() => setDescriptionExpanded(!descriptionExpanded)}
              className='flex items-center justify-between pb-2 border-b border-indigo-600 group'>
              <h2 className='text-sm font-bold leading-none'>
                Project Description
              </h2>
              <CaretDown
                size={16}
                weight='bold'
                className={clsx(
                  "transform transition-transform duration-300 group-hover:text-indigo-500 cursor-pointer",
                  descriptionExpanded && "rotate-180"
                )}
              />
            </div>
            <div
              className={clsx(
                "text-[10px] leading-normal",
                !descriptionExpanded && "line-clamp-3"
              )}>
              <div className='prose prose-xs'>
                <ReactMarkdown>{strategy?.project.description}</ReactMarkdown>
              </div>
            </div>
            {!descriptionExpanded && (
              <div
                onClick={() => setDescriptionExpanded(!descriptionExpanded)}
                className='text-[10px] font-semibold inline-flex underline hover:text-indigo-500 cursor-pointer'>
                View All
              </div>
            )}
          </div>

          <div className='bg-indigo-50 p-3 rounded-xl space-y-3'>
            <div
              onClick={() => setScoreExpanded(!scoreExpanded)}
              className='flex items-center justify-between pb-2 border-b border-indigo-600 group'>
              <div className='flex items-center space-x-2'>
                <h2 className='text-sm font-bold leading-none'>Score</h2>
                <div className='px-1 bg-white border border-indigo-300 rounded'>
                  <Score
                    rank={strategy.smart_ranking || 0.0}
                    icon={false}
                    small
                  />
                </div>
              </div>
              <CaretDown
                size={16}
                weight='bold'
                className={clsx(
                  "transform transition-transform duration-300 group-hover:text-indigo-500 cursor-pointer",
                  scoreExpanded && "rotate-180"
                )}
              />
            </div>
            <div className='grid gap-2 grid-cols-3 items-center'>
              {[
                {
                  category: "Funding Needs",
                  value: strategy.funding_needed,
                },
                { category: "Impact", value: strategy.impact },
                {
                  category: "Relevance",
                  value: strategy.interest,
                },
              ].map((item, i) => (
                <div
                  className='rounded-md p-1.5 border border-indigo-300 bg-white leading-none space-y-1.5 w-full'
                  key={i}>
                  <div className='text-[8px] text-indigo-400 uppercase tracking-wide leading-none'>
                    {item.category}
                  </div>
                  <div className='text-md'>
                    {((item.value as number) * 10).toFixed(2)}
                    <span className='text-xs text-indigo-400 leading-none'>
                      /10
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div
              className={clsx(
                "text-[10px] leading-normal",
                !scoreExpanded && "line-clamp-2"
              )}>
              {strategy?.reasoning}
            </div>
            {!scoreExpanded && (
              <div
                onClick={() => setScoreExpanded(!scoreExpanded)}
                className='text-[10px] font-semibold inline-flex underline hover:text-indigo-500 cursor-pointer'>
                View All
              </div>
            )}
          </div>

          <div className='bg-indigo-50 p-3 rounded-xl space-y-3'>
            <div
              onClick={() => setReportExpanded(!reportExpanded)}
              className='flex items-center justify-between pb-2 border-b border-indigo-600 group'>
              <h2 className='text-sm font-bold leading-none'>Report</h2>
              <CaretDown
                size={16}
                weight='bold'
                className={clsx(
                  "transform transition-transform duration-300 group-hover:text-indigo-500 cursor-pointer",
                  reportExpanded && "rotate-180"
                )}
              />
            </div>
            <div
              className={clsx(
                "text-[10px] leading-normal",
                !reportExpanded && "line-clamp-3"
              )}>
              <div className='prose prose-xs prose-hide-h1'>
                <ReactMarkdown>{strategy?.report}</ReactMarkdown>
              </div>
            </div>
            {!reportExpanded && (
              <div
                onClick={() => setReportExpanded(!reportExpanded)}
                className='text-[10px] font-semibold inline-flex underline hover:text-indigo-500 cursor-pointer'>
                View All
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};

export default ProjectModal;

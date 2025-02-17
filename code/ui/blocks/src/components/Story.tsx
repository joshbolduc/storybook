import { global } from '@storybook/global';
import type { FunctionComponent } from 'react';
import React, { useRef, useEffect, useState } from 'react';
import type { DocsContextProps, PreparedStory } from '@storybook/types';
import { Loader, getStoryHref } from '@storybook/components';
import { IFrame } from './IFrame';
import { ZoomContext } from './ZoomContext';

const { PREVIEW_URL } = global;
const BASE_URL = PREVIEW_URL || 'iframe.html';

interface CommonProps {
  story: PreparedStory;
  inline: boolean;
  primary: boolean;
}

interface InlineStoryProps extends CommonProps {
  inline: true;
  height?: string;
  autoplay: boolean;
  forceInitialArgs: boolean;
  renderStoryToElement: DocsContextProps['renderStoryToElement'];
}

interface IFrameStoryProps extends CommonProps {
  inline: false;
  height: string;
}

export type StoryProps = InlineStoryProps | IFrameStoryProps;

export const storyBlockIdFromId = ({ story, primary }: StoryProps) =>
  `story--${story.id}${primary ? '--primary' : ''}`;

const InlineStory: FunctionComponent<InlineStoryProps> = (props) => {
  const storyRef = useRef();
  const [showLoader, setShowLoader] = useState(true);

  const { story, height, autoplay, forceInitialArgs, renderStoryToElement } = props;

  useEffect(() => {
    if (!(story && storyRef.current)) {
      return () => {};
    }
    const element = storyRef.current as HTMLElement;
    const cleanup = renderStoryToElement(story, element, { autoplay, forceInitialArgs });
    setShowLoader(false);
    return () => {
      cleanup();
    };
  }, [autoplay, renderStoryToElement, story]);

  // We do this so React doesn't complain when we replace the span in a secondary render
  const htmlContents = `<span></span>`;

  return (
    <>
      {height ? (
        <style>{`${storyBlockIdFromId(
          props
        )} { min-height: ${height}; transform: translateZ(0); overflow: auto }`}</style>
      ) : null}
      {showLoader && <StorySkeleton />}
      <div
        ref={storyRef}
        id={`${storyBlockIdFromId(props)}-inner`}
        data-name={story.name}
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: htmlContents }}
      />
    </>
  );
};

const IFrameStory: FunctionComponent<IFrameStoryProps> = ({ story, height = '500px' }) => (
  <div style={{ width: '100%', height }}>
    <ZoomContext.Consumer>
      {({ scale }) => {
        return (
          <IFrame
            key="iframe"
            id={`iframe--${story.id}`}
            title={story.name}
            src={getStoryHref(BASE_URL, story.id, { viewMode: 'story' })}
            allowFullScreen
            scale={scale}
            style={{
              width: '100%',
              height: '100%',
              border: '0 none',
            }}
          />
        );
      }}
    </ZoomContext.Consumer>
  </div>
);

/**
 * A story element, either rendered inline or in an iframe,
 * with configurable height.
 */
const Story: FunctionComponent<StoryProps> = (props) => {
  const { inline } = props;

  return (
    <div id={storyBlockIdFromId(props)} className="sb-story">
      {inline ? (
        <InlineStory {...(props as InlineStoryProps)} />
      ) : (
        <IFrameStory {...(props as IFrameStoryProps)} />
      )}
    </div>
  );
};

const StorySkeleton = () => <Loader />;

export { Story, StorySkeleton };

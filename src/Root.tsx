import React from 'react';
import {Composition} from 'remotion';
import {Film, calcFilm} from './film/Film';
import {Sheet, calcSheet} from './film/Sheet';

// connect-ai-motion: Film (16:9), FilmShort (9:16), FilmSquare (1:1), Sheet (stills on one page).
// The storyboard comes in as props (the CLI passes it; the Studio shows the empty card until you pass one).
export const Root: React.FC = () => (
  <>
    <Composition id="Film" component={Film} calculateMetadata={calcFilm} defaultProps={{data: null, aspect: '16x9' as const}} durationInFrames={90} fps={30} width={1920} height={1080} />
    <Composition id="FilmShort" component={Film} calculateMetadata={calcFilm} defaultProps={{data: null, aspect: '9x16' as const}} durationInFrames={90} fps={30} width={1080} height={1920} />
    <Composition id="FilmSquare" component={Film} calculateMetadata={calcFilm} defaultProps={{data: null, aspect: '1x1' as const}} durationInFrames={90} fps={30} width={1080} height={1080} />
    <Composition id="Sheet" component={Sheet} calculateMetadata={calcSheet} defaultProps={{data: null, aspect: '16x9' as const, mode: 'beats' as const}} durationInFrames={1} fps={30} width={1000} height={1000} />
  </>
);

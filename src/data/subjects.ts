import lettersImg from '../assets/illustrations/lion-abc.png';
import storybooksImg from '../assets/illustrations/bear-storybooks.png';
import mathImg from '../assets/illustrations/dinosaur-math.png';
import shapesImg from '../assets/illustrations/elephant-shapes.png';
import drawSingImg from '../assets/illustrations/penguin-music.png';
import type { Subject, Topic } from '../types';

export const subjects: Subject[] = [
  { id: 'letters', label: 'Letters & Phonics', icon: 'fa-solid fa-spell-check', image: lettersImg },
  { id: 'storybooks', label: 'Storybooks', icon: 'fa-solid fa-book-open', image: storybooksImg },
  { id: 'math', label: 'Math & Counting', icon: 'fa-solid fa-calculator', image: mathImg },
  { id: 'shapes', label: 'Shapes & Logic', icon: 'fa-solid fa-shapes', image: shapesImg },
  { id: 'feelings', label: 'Feelings & Friends', icon: 'fa-solid fa-face-smile' },
  { id: 'science', label: 'Explore Science', icon: 'fa-solid fa-flask' },
  { id: 'draw-sing', label: 'Draw & Sing', icon: 'fa-solid fa-palette', image: drawSingImg },
];

export const topicsBySubject: Record<string, Topic[]> = {
  letters: [
    { id: 'alphabet', label: 'Alphabet', icon: 'fa-solid fa-a' },
    { id: 'sounds', label: 'Sounds', icon: 'fa-solid fa-ear-listen' },
    { id: 'tracing', label: 'Tracing', icon: 'fa-solid fa-pen' },
    { id: 'sight-words', label: 'Sight Words', icon: 'fa-solid fa-glasses' },
    { id: 'rhyming', label: 'Rhyming', icon: 'fa-solid fa-music' },
    { id: 'blending', label: 'Blending', icon: 'fa-solid fa-layer-group' },
    { id: 'vowels', label: 'Vowels', icon: 'fa-solid fa-star' },
    { id: 'capitals', label: 'Capitals', icon: 'fa-solid fa-font' },
    { id: 'spelling', label: 'Spelling', icon: 'fa-solid fa-keyboard' },
    { id: 'word-families', label: 'Word Families', icon: 'fa-solid fa-people-group' },
  ],
  storybooks: [
    { id: 'read-to-me', label: 'Read to Me', icon: 'fa-solid fa-headphones' },
    { id: 'animal-tales', label: 'Animal Tales', icon: 'fa-solid fa-paw' },
    { id: 'fairy-tales', label: 'Fairy Tales', icon: 'fa-solid fa-hat-wizard' },
    { id: 'adventure-stories', label: 'Adventure Stories', icon: 'fa-solid fa-compass' },
    { id: 'bedtime-stories', label: 'Bedtime Stories', icon: 'fa-solid fa-moon' },
    { id: 'science-stories', label: 'Science Stories', icon: 'fa-solid fa-flask' },
    { id: 'chapter-books', label: 'My First Chapter Book', icon: 'fa-solid fa-book' },
  ],
  math: [
    { id: 'counting', label: 'Counting 1-10', icon: 'fa-solid fa-hashtag' },
    { id: 'number-recognition', label: 'Number Recognition', icon: 'fa-solid fa-1' },
    { id: 'more-fewer', label: 'More or Fewer', icon: 'fa-solid fa-scale-balanced' },
    { id: 'addition', label: 'Addition', icon: 'fa-solid fa-plus' },
    { id: 'subtraction', label: 'Subtraction', icon: 'fa-solid fa-minus' },
    { id: 'patterns', label: 'Patterns', icon: 'fa-solid fa-repeat' },
    { id: 'telling-time', label: 'Telling Time', icon: 'fa-solid fa-clock' },
  ],
  shapes: [
    { id: 'shape-id', label: 'Shape ID', icon: 'fa-solid fa-shapes' },
    { id: 'matching', label: 'Matching Games', icon: 'fa-solid fa-clone' },
    { id: 'patterns', label: 'Patterns', icon: 'fa-solid fa-repeat' },
    { id: 'mazes', label: 'Mazes', icon: 'fa-solid fa-route' },
    { id: 'sorting', label: 'Sorting', icon: 'fa-solid fa-arrow-down-a-z' },
    { id: 'sequencing', label: 'Sequencing', icon: 'fa-solid fa-list-ol' },
    { id: 'spatial-puzzles', label: 'Spatial Puzzles', icon: 'fa-solid fa-puzzle-piece' },
  ],
  feelings: [
    { id: 'naming-feelings', label: 'Naming Feelings', icon: 'fa-solid fa-face-smile' },
    { id: 'making-friends', label: 'Making Friends', icon: 'fa-solid fa-people-arrows' },
    { id: 'sharing-kindness', label: 'Sharing & Kindness', icon: 'fa-solid fa-hand-holding-heart' },
    { id: 'calm-corner', label: 'Calm Down Corner', icon: 'fa-solid fa-spa' },
    { id: 'empathy-stories', label: 'Empathy Stories', icon: 'fa-solid fa-book-heart' },
  ],
  science: [
    { id: 'animals', label: 'Animals', icon: 'fa-solid fa-paw' },
    { id: 'weather', label: 'Weather', icon: 'fa-solid fa-cloud-sun' },
    { id: 'plants', label: 'Plants', icon: 'fa-solid fa-seedling' },
    { id: 'space', label: 'Space', icon: 'fa-solid fa-rocket' },
    { id: 'five-senses', label: 'Five Senses', icon: 'fa-solid fa-hand' },
    { id: 'simple-machines', label: 'Simple Machines', icon: 'fa-solid fa-gears' },
  ],
  'draw-sing': [
    { id: 'free-draw', label: 'Free Draw', icon: 'fa-solid fa-paintbrush' },
    { id: 'sing-along', label: 'Sing Along', icon: 'fa-solid fa-microphone' },
    { id: 'rhythm-games', label: 'Rhythm Games', icon: 'fa-solid fa-drum' },
    { id: 'coloring', label: 'Coloring', icon: 'fa-solid fa-palette' },
    { id: 'music-makers', label: 'Music Makers', icon: 'fa-solid fa-music' },
  ],
};

export const avatarOptions = [
  { icon: 'fa-solid fa-cat', color: '#FF6F61' },
  { icon: 'fa-solid fa-dog', color: '#2EC4B6' },
  { icon: 'fa-solid fa-dragon', color: '#8E7CFF' },
  { icon: 'fa-solid fa-frog', color: '#3DDC97' },
  { icon: 'fa-solid fa-fish', color: '#4CC3FF' },
  { icon: 'fa-solid fa-hippo', color: '#FF6FA5' },
];

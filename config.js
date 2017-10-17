var config = {};

// Modify this file to your liking

config.inkscapePath = process.env.INKSCAPE_PATH || 'C:\\Program Files\\Inkscape\\inkscape.exe';

config.sourceColors = [
  '2394BC',
  '56B48C',
  '3B88C3',
];

config.targetColors = [
  { color: 'dd614a', name: 'red' },
  { color: '56b48c', name: 'green' },
  { color: '4a4a4a', name: 'grey' },
  { color: '2394bc', name: 'blue' }
];

config.sourceFolder = './files';


module.exports = config;

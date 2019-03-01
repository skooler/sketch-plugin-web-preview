import sketch from 'sketch';
import UI from 'sketch/ui';

export default function(context) {
  const doc = sketch.fromNative(context.document);
  const output = NSTemporaryDirectory();

  const views = doc.selectedLayers.reduce((ary, layer) => {
    if (layer.type === 'Artboard') {
      sketch.export(layer, {
        formats: 'png',
        output,
        scales: '1, 2',
        'use-id-for-name': true
      });
      const obj = layer.sketchObject;
      const color = obj.hasBackgroundColor() === 1 ?
        obj.backgroundColor().immutableModelObject().hexValue() :
          'FFF';
      ary.push({
        color,
        id: layer.id,
        width: layer.frame.width
      });
    }
    return ary;
  }, []);

  if (views.length === 0) {
    UI.message('You must have at least one artboard.');
    return;
  }

  views.sort((a, b) => a.width - b.width);

  const mediaqueries = views
    .map((view, i) => {
      const images = views
        .map((v) => `#i-${v.id}{display:${v.id === view.id ? 'block' : 'none'};}`)
        .join('');
      const styles = `body{background:#${view.color}}${images}`;
      return i > 0 ? `@media(min-width:${view.width}px){${styles}}` : styles;
    })
    .join('');
  const images = views
    .map((view) => `<img id="i-${view.id}" src="./${view.id}.png">`)
    .join('');
  const html = `<html><head><meta charset="UTF-8"><style>` +
    `body{margin:0;padding:0;}img{height:auto;margin:0 auto;` +
    `user-select:none;width:100%;}${mediaqueries}</style>` +
    `</head><body>${images}</body></html>`;

  const filename = `${output}index.html`;
  NSString.stringWithString_(html)
    .dataUsingEncoding_(NSUTF8StringEncoding)
    .writeToFile_atomically_(filename, true);
  NSWorkspace.sharedWorkspace()
    .openFile(NSURL.fileURLWithPath(filename).path());
};

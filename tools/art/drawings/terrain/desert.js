// Owner-reviewed native 24px desert hex marker.
import { fromSvg } from '../../painter.js';
const SVG = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" shape-rendering=\"crispEdges\"><path fill=\"#f3dca2\" d=\"M18 3h3v1h-3zM18 4h3v1h-3zM18 5h3v1h-3zM15 6h9v1h-9zM15 7h9v1h-9zM15 8h9v1h-9zM9 9h9v1h-9zM9 10h9v1h-9zM9 11h9v1h-9zM6 12h6v1h-6zM6 13h6v1h-6zM6 14h6v1h-6zM3 15h6v1h-6zM3 16h6v1h-6zM3 17h6v1h-6zM0 18h6v1h-6zM0 19h6v1h-6zM0 20h6v1h-6z\"/><path fill=\"#e2c07a\" d=\"M18 9h6v1h-6zM18 10h6v1h-6zM18 11h6v1h-6zM12 12h12v1h-12zM12 13h12v1h-12zM12 14h12v1h-12zM9 15h15v1h-15zM9 16h15v1h-15zM9 17h15v1h-15zM6 18h15v1h-15zM6 19h15v1h-15zM6 20h15v1h-15z\"/><path fill=\"#b59961\" d=\"M21 18h3v1h-3zM21 19h3v1h-3zM21 20h3v1h-3zM0 21h24v1h-24zM0 22h24v1h-24zM0 23h24v1h-24z\"/></svg>";
/** Returns the reviewed marker. @returns {import('../../painter.js').Canvas} */
export function draw() { return fromSvg(SVG); }

// Approved track symbol territory-tile, preserved pixel for pixel.
import { fromSvg } from '../../painter.js';

const SVG = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" shape-rendering=\"crispEdges\"><path fill=\"#e8ddc4\" d=\"M11 1h2v1h-2zM9 2h6v1h-6zM7 3h4v1h-4zM13 3h4v1h-4zM5 4h5v1h-5zM14 4h5v1h-5zM4 5h4v1h-4zM16 5h4v1h-4zM2 6h4v1h-4zM18 6h4v1h-4zM2 7h2v1h-2zM20 7h2v1h-2zM2 8h2v1h-2zM20 8h2v1h-2zM2 9h2v1h-2zM20 9h2v1h-2zM2 10h2v1h-2zM20 10h2v1h-2zM2 11h2v1h-2zM20 11h2v1h-2zM2 12h2v1h-2zM20 12h2v1h-2zM2 13h2v1h-2zM20 13h2v1h-2zM2 14h2v1h-2zM20 14h2v1h-2zM2 15h2v1h-2zM20 15h2v1h-2zM2 16h2v1h-2zM20 16h2v1h-2zM2 17h4v1h-4zM18 17h4v1h-4zM4 18h4v1h-4zM16 18h4v1h-4zM5 19h5v1h-5zM14 19h5v1h-5zM7 20h4v1h-4zM13 20h4v1h-4zM9 21h6v1h-6zM11 22h2v1h-2z\"/></svg>";

export function draw() {
	return fromSvg(SVG);
}

// Approved track symbol victory-points, preserved pixel for pixel.
import { fromSvg } from '../../painter.js';

const SVG = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" shape-rendering=\"crispEdges\"><path fill=\"#120c1e\" d=\"M6 2h12v1h-12zM6 3h1v1h-1zM17 3h1v1h-1zM3 4h4v1h-4zM17 4h4v1h-4zM3 5h1v1h-1zM6 5h1v1h-1zM17 5h1v1h-1zM20 5h1v1h-1zM3 6h1v1h-1zM6 6h1v1h-1zM17 6h1v1h-1zM20 6h1v1h-1zM3 7h1v1h-1zM6 7h1v1h-1zM17 7h1v1h-1zM20 7h1v1h-1zM3 8h1v1h-1zM6 8h1v1h-1zM17 8h1v1h-1zM20 8h1v1h-1zM3 9h1v1h-1zM6 9h1v1h-1zM17 9h1v1h-1zM20 9h1v1h-1zM3 10h4v1h-4zM17 10h4v1h-4zM6 11h1v1h-1zM17 11h1v1h-1zM6 12h3v1h-3zM15 12h3v1h-3zM6 13h3v1h-3zM15 13h3v1h-3zM8 14h1v1h-1zM15 14h1v1h-1zM8 15h8v1h-8zM8 16h1v1h-1zM15 16h1v1h-1zM11 17h2v1h-2zM11 18h1v1h-1zM11 19h1v1h-1zM6 20h12v1h-12zM6 21h12v1h-12z\"/><path fill=\"#e2b857\" d=\"M7 3h10v1h-10zM7 4h10v1h-10zM4 5h2v1h-2zM7 5h2v1h-2zM15 5h2v1h-2zM18 5h2v1h-2zM4 6h2v1h-2zM7 6h2v1h-2zM15 6h2v1h-2zM18 6h2v1h-2zM4 7h2v1h-2zM7 7h4v1h-4zM13 7h4v1h-4zM18 7h2v1h-2zM4 8h2v1h-2zM7 8h4v1h-4zM13 8h4v1h-4zM18 8h2v1h-2zM4 9h2v1h-2zM7 9h4v1h-4zM13 9h4v1h-4zM18 9h2v1h-2zM7 10h4v1h-4zM13 10h4v1h-4zM7 11h10v1h-10zM9 12h6v1h-6zM9 13h6v1h-6zM9 14h6v1h-6zM9 16h6v1h-6zM12 18h1v1h-1zM12 19h1v1h-1z\"/><path fill=\"#e8ddc4\" d=\"M9 5h6v1h-6zM9 6h6v1h-6zM11 7h2v1h-2zM11 8h2v1h-2zM11 9h2v1h-2zM11 10h2v1h-2z\"/></svg>";

export function draw() {
	return fromSvg(SVG);
}

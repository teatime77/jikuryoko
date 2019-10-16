import { Drawable, GPGPU, TextureInfo, Package }  from "./lib/gpgpu.js";
import { makePlaneBuffers, Box } from  "./lib/shape.js";

export let mapBox: Box = new Box(-2, 2, -2, 2, 0, 0);
export class CanvasDrawable extends Drawable {
    canvas: HTMLCanvasElement;

    constructor(canvas: HTMLCanvasElement) {
        super();
        this.canvas = canvas;
    }

    getParam() {
        if (!this.package) {

            var [mesh, idx_array] = makePlaneBuffers(mapBox, 11, 11, new TextureInfo(null, null, this.canvas));

            this.package = {
                id: "Earth",
                vertexShader: GPGPU.textureSphereVertexShader,
                fragmentShader: GPGPU.defaultFragmentShader,
                args: mesh,
                VertexIndexBuffer: idx_array
            } as any as Package;
        }

        return this.package;
    }
}

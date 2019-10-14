import { CreateGPGPU, GPGPU, DrawParam, UI3D, TextureInfo, Package }  from "./lib/gpgpu.js";
import { CanvasDrawable } from "./draw.js";

const stations : Station[] = [];
let cnvMap : HTMLCanvasElement;
let cnvSize : Vec2;
let ctx : CanvasRenderingContext2D;
let mygpgpu : GPGPU = undefined;
let ui : UI;
let canvasDrawable: CanvasDrawable;

function msg(text: string){
    console.log(text);
}

function getScale(): Vec2 {
    return cnvSize.div(ui.viewSize);
}

class Vec2 {
    x: number;
    y: number;

    constructor(x: number, y: number){
        this.x = x;
        this.y = y;
    }

    add(n: number | Vec2) : Vec2 {
        if(n instanceof Vec2){

            return new Vec2(this.x + n.x, this.y + n.y);
        }
        else{

            return new Vec2(this.x + n, this.y + n);
        }
    }

    sub(n: number | Vec2) : Vec2 {
        if(n instanceof Vec2){

            return new Vec2(this.x - n.x, this.y - n.y);
        }
        else{

            return new Vec2(this.x - n, this.y - n);
        }
    }

    mul(n: number | Vec2) : Vec2 {
        if(n instanceof Vec2){

            return new Vec2(this.x * n.x, this.y * n.y);
        }
        else{

            return new Vec2(this.x * n, this.y * n);
        }
    }

    div(n: number | Vec2) : Vec2 {
        if(n instanceof Vec2){

            console.assert(n.x != 0 && n.y != 0);
            return new Vec2(this.x / n.x, this.y / n.y);
        }
        else{

            console.assert(n != 0);
            return new Vec2(this.x / n, this.y / n);
        }
    }
}

class Title {
    en: string;
    ja: string;

    constructor(en: string, ja: string){
        this.en = en;
        this.ja = ja;
    }
}

class Station {
    pos: Vec2;
    title: Title;

    constructor(obj:Station){
        this.pos = new Vec2(obj["geo:lat"], obj["geo:long"]);

        const title = obj["odpt:stationTitle"] as Title;
        this.title = new Title(title.en, title.ja);
    }

    mateText(){
        SVGTextElement
    }
}

function fetchJson(path:string, fnc:(json: any[])=>void){
    let k = window.location.href.indexOf("/index.html");

    const url = `${window.location.href.substring(0, k)}/${path}`;
    msg(`fetch-json:${url}`);
    fetch(encodeURI(url))
    .then((res: Response) => {
        return res.json();
    })
    .then(json => {
        console.log(`OK:${json.length}`);
        // for(let obj of json){
        //     console.log(`${JSON.stringify(obj)}\n`);
        // }
        fnc(json);
    })
    .catch(error => {
        console.error('Error:', error);
    });

}

export function getData(param: string, fnc:(json: any[])=>void = undefined){
    const url = `https://api-tokyochallenge.odpt.org/api/v4/${param}acl:consumerKey=f8a426086fae1ea48b8b0dd269709363c2a2ceb385d8f80bcdc5a4927cabcdc8`;
    console.log(`req:${url}`)

    fetch(encodeURI(url))
    .then((res: Response) => {
        return res.json();
    })
    .then(json => {
        console.log(`OK:${json.length}`);
        for(let obj of json){
            console.log(`${JSON.stringify(obj)}\n`);
        }
        if(fnc != undefined){

            fnc(json);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function isNull(obj:any): boolean {
    return obj == undefined || obj == null;
}

function getStations(objs:[]){
    for(let obj of objs){

        if(isNull(obj["geo:lat"]) || isNull(obj["geo:long"])){
            msg(`位置不明:${obj["odpt:stationTitle"]["ja"]}`);
            
        }
        else{

            stations.push( new Station(obj as Station) );
        }
    }

    for(let sta of stations){
        msg(`${sta.title.ja} ${sta.pos.x} ${sta.pos.y} `);
    }

    const minX = stations.map(a => a.pos.x).reduce((a, b) => Math.min(a, b));
    const minY = stations.map(a => a.pos.y).reduce((a, b) => Math.min(a, b));

    const maxX = stations.map(a => a.pos.x).reduce((a, b) => Math.max(a, b));
    const maxY = stations.map(a => a.pos.y).reduce((a, b) => Math.max(a, b));

    ui.mapPos = new Vec2(minX, minY);
    ui.viewSize = new Vec2(maxX - minX, maxY - minY);

    ui.viewPos = new Vec2(minX, minY);
    ui.viewSize = new Vec2(maxX - minX, maxY - minY);

    drawStations();

    if(mygpgpu == undefined){

        setTimeout(function(){
            testCanvasDrawable();

        }, 100);
    }
}

function drawStations(){
    const scale = cnvSize.div(ui.viewSize);

    msg(`pos:(${ui.viewPos.x} ${ui.viewPos.y}) size:(${ui.viewSize.x} ${ui.viewSize.y}) scale:(${scale.x} ${scale.y})`)

    ctx.clearRect(0, 0, cnvMap.width, cnvMap.height);
    for(let sta of stations){
        const x = (sta.pos.x - ui.viewPos.x) * scale.x;
        const y = (sta.pos.y - ui.viewPos.y) * scale.y;
        if(0 <= x && x < cnvSize.x && 0 <= y && y < cnvSize.y){

            ctx.strokeText(sta.title.ja, x, y);
        }
    }

    if(mygpgpu != undefined){

        const param = canvasDrawable.getParam();
        const pkg = mygpgpu.packages[param.id] as Package;
        const texInf = Array.from(pkg.textures).find(x => x instanceof TextureInfo && x.value == cnvMap) as TextureInfo;
        console.assert(texInf != undefined);
        texInf.dirty = true
    }
}


class UI extends UI3D {
    mapPos: Vec2;
    mapSize: Vec2;

    viewPos: Vec2;
    viewSize: Vec2;

    downPos: Vec2;
    lastPos: Vec2;
    captured: boolean = false;

    pointerdown = (ev: PointerEvent, drawParam: DrawParam)=>{
        msg(`pointerdown`);
        this.captured = true;
        mygpgpu.canvas.setPointerCapture(ev.pointerId);

        this.downPos = new Vec2(ev.clientX, ev.clientY);
        this.lastPos = new Vec2(ev.clientX, ev.clientY);
    }

    pointerup = (ev: PointerEvent, drawParam: DrawParam)=>{
        msg(`pointerup`);
        this.captured = false;
        mygpgpu.canvas.releasePointerCapture(ev.pointerId);
    }

    pointermove = (ev: PointerEvent, drawParam: DrawParam)=>{
        if(! this.captured){
            return;
        }
        msg(`move`);
        let newPos = new Vec2(ev.clientX, ev.clientY);

        if (ev.buttons != 0 && this.lastPos != undefined) {

            const diff = newPos.sub(this.lastPos).div(300);
            if(ev.shiftKey){

                const diff = newPos.sub(this.lastPos).div(300);
                drawParam.x += diff.x;
                drawParam.y -= diff.y;
            }
            else if(ev.ctrlKey){

                drawParam.xRot += diff.y;
                drawParam.yRot += diff.x;
            }
            else{

                const diff = newPos.sub(this.lastPos);
                const scaledDiff = diff.div(getScale());
                ui.viewPos = ui.viewPos.sub(scaledDiff);
                drawStations();
            }
        }

        this.lastPos = newPos;
    }

    wheel = (ev: WheelEvent, drawParam: DrawParam)=>{
        msg(`wheel:${ev.deltaY}`);

        // ホイール操作によるスクロールを無効化する
        ev.preventDefault();

        if(ev.ctrlKey){

            drawParam.z += 0.002 * ev.deltaY;
        }
        else{
            const center = ui.viewPos.add(ui.viewSize.mul(0.5));
            ui.viewSize = ui.viewSize.mul(1 + 0.002 * ev.deltaY);
            ui.viewPos = center.sub(ui.viewSize.mul(0.5));
            drawStations();
        }
    }
}

function testCanvasDrawable(){
    canvasDrawable = new CanvasDrawable(cnvMap);

    var webGlCanvas = document.getElementById("webgl-canvas") as HTMLCanvasElement;

    mygpgpu = CreateGPGPU(webGlCanvas, ui);

    mygpgpu.startDraw3D([ 
        canvasDrawable,
    ]);
}


export function initJikuRyoko(){
    ui = new UI();

    // fetchJson("json/Stations.json", (data:any[])=>{
    //     msg(`駅 done:${data.length}`)
    // });
    fetchJson("json/Stations.json", getStations);


    cnvMap = document.getElementById("canvas-map") as HTMLCanvasElement;
    cnvSize = new Vec2(cnvMap.width, cnvMap.height);
    ctx = cnvMap.getContext('2d');
    
    // getData("odpt:Station?odpt:operator=odpt.Operator:Keio&", getStations);


    const inputs = document.getElementsByTagName("input");
    const buttons = Array.from(inputs).filter(x => x.type=="button");
    for(let button of buttons){
        button.onclick = btnClick;
    }
}    

function paramOnClick(){
    const text = (document.getElementById("txt-param") as HTMLInputElement).value;
    getData(text);
}

function btnClick(){
    const src = window.event.srcElement as HTMLInputElement;
    getData(src.value);
}    

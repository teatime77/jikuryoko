import { CreateGPGPU, GPGPU, DrawParam }  from "./lib/gpgpu.js";
import { CanvasDrawable } from "./draw.js";

const stations : Station[] = [];
let cnvMap : HTMLCanvasElement;
let ctx : CanvasRenderingContext2D;
let mygpgpu : GPGPU = undefined;
let ui : UI;

function msg(text: string){
    console.log(text);
}

class Vec2 {
    x: number;
    y: number;

    constructor(x: number, y: number){
        this.x = x;
        this.y = y;
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
    const span = new Vec2(maxX - minX, maxY - minY);
    const scale = new Vec2(cnvMap.width / span.x, cnvMap.height / span.y);

    msg(`(${minX} ${minY}) -  (${maxX} ${maxY}) , span:(${span.x} ${span.y}), scale:(${scale.x} ${scale.y})`)

    for(let sta of stations){
        ctx.strokeText(sta.title.ja, (sta.pos.x - minX) * scale.x, (sta.pos.y - minY) * scale.y);
    }

    if(mygpgpu == undefined){

        setTimeout(function(){
            testCanvasDrawable();

        }, 100);
    }
}

class UI {
    lastMouseX: number = null;
    lastMouseY: number = null;

    mousemove(ev: MouseEvent, drawParam: DrawParam){
        msg(`move`);
        var newX = ev.clientX;
        var newY = ev.clientY;

        if (ev.buttons != 0 && this.lastMouseX != null) {

            if(ev.shiftKey){

                drawParam.x += (newX - this.lastMouseX) / 300;
                drawParam.y -= (newY - this.lastMouseY) / 300;
            }
            else{

                drawParam.xRot += (newY - this.lastMouseY) / 300;
                drawParam.yRot += (newX - this.lastMouseX) / 300;
            }
        }

        this.lastMouseX = newX
        this.lastMouseY = newY;
    }

    touchmove(ev: TouchEvent, drawParam: DrawParam){
        msg(`touch`);
        // タッチによる画面スクロールを止める
        ev.preventDefault(); 

        var newX = ev.changedTouches[0].clientX;
        var newY = ev.changedTouches[0].clientY;

        if (this.lastMouseX != null) {

            drawParam.xRot += (newY - this.lastMouseY) / 300;
            drawParam.yRot += (newX - this.lastMouseX) / 300;
        }

        this.lastMouseX = newX
        this.lastMouseY = newY;
    }


    wheel(ev: WheelEvent, drawParam: DrawParam){
        msg(`wheel`);
        drawParam.z += 0.002 * ev.deltaY;

        // ホイール操作によるスクロールを無効化する
        ev.preventDefault();
    }
}

function testCanvasDrawable(){
    const canvasDrawable = new CanvasDrawable(cnvMap);

    var webGlCanvas = document.getElementById("webgl-canvas") as HTMLCanvasElement;

    ui = new UI();
    mygpgpu = CreateGPGPU(webGlCanvas);

    mygpgpu.mousemove = ui.mousemove;
    mygpgpu.touchmove = ui.touchmove;
    mygpgpu.wheel     = ui.wheel;

    mygpgpu.startDraw3D([ 
        canvasDrawable,
    ]);
}


export function initJikuRyoko(){
    // fetchJson("json/Stations.json", (data:any[])=>{
    //     msg(`駅 done:${data.length}`)
    // });
    fetchJson("json/Stations.json", getStations);


    cnvMap = document.getElementById("canvas-map") as HTMLCanvasElement;
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

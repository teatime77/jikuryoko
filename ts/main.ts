import { CreateGPGPU, GPGPU }  from "./lib/gpgpu.js";
import { CanvasDrawable } from "./draw.js";

const stations : Station[] = [];
let cnvMap : HTMLCanvasElement;
let ctx : CanvasRenderingContext2D;
let mygpgpu : GPGPU = undefined;

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

function getStations(objs:[]){
    for(let obj of objs){

        stations.push( new Station(obj as Station) );
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

function testCanvasDrawable(){
    const canvasDrawable = new CanvasDrawable(cnvMap);

    var webGlCanvas = document.getElementById("webgl-canvas") as HTMLCanvasElement;
    mygpgpu = CreateGPGPU(webGlCanvas);
    mygpgpu.startDraw3D([ 
        canvasDrawable,
    ]);
}


export function initJikuRyoko(){
    cnvMap = document.getElementById("canvas-map") as HTMLCanvasElement;
    ctx = cnvMap.getContext('2d');
    
    getData("odpt:Station?odpt:operator=odpt.Operator:Keio&", getStations);
}    

export function paramOnClick(){
    const text = (document.getElementById("txt-param") as HTMLInputElement).value;
    getData(text);
}

export function btnClick(){
    const src = window.event.srcElement as HTMLInputElement;
    getData(src.value);
}    

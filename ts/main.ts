import { CreateGPGPU, GPGPU, DrawParam, UI3D, TextureInfo, Package, Vertex, Points, Color }  from "./lib/gpgpu.js";
import { CanvasDrawable, mapBox } from "./draw.js";

let operators : Operator[];
let railways  : Railway[];
let stations  : Map<string, Station>;
let timetableReady: boolean = false;

let cnvMap : HTMLCanvasElement;
let cnvSize : Vec2;
let ctx : CanvasRenderingContext2D;
let mygpgpu : GPGPU = undefined;
let ui : UI;
let canvasDrawable: CanvasDrawable;
let timeDrawable : Points;
let timePoints: Vertex[];

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

class Operator {
    title: string;
    sameAs: string;

    constructor(obj:any){
        this.title = obj["dc:title"];

        const sameAs = obj["owl:sameAs"] as string;
        if(sameAs.startsWith("odpt.Operator:")){
            this.sameAs = sameAs.substring("odpt.Operator:".length);
        }
        else{
            msg(`same as error 2:${sameAs} ${this.title}`);
        }
    }
}

class Railway {
    title: string;
    sameAs: string;

    constructor(obj:any){
        this.title = obj["dc:title"];

        const sameAs = obj["owl:sameAs"] as string;
        if(sameAs.startsWith("odpt.Railway:")){
            this.sameAs = sameAs.substring("odpt.Railway:".length);
        }
        else{
            msg(`same as error 2:${sameAs} ${this.title}`);
        }
    }
}

class Station {
    pos: Vec2;
    title: Title;
    timetables : Timetable[] = [];

    // owl:sameAs: "odpt.Station:Tobu.Daishi.Nishiarai"
    sameAs: string;

    constructor(obj:any){
        this.pos = new Vec2(obj["geo:long"], obj["geo:lat"]);

        const title = obj["odpt:stationTitle"] as Title;
        this.title = new Title(title.en, title.ja);
        const sameAs = obj["owl:sameAs"] as string;
        if(sameAs.startsWith("odpt.Station:")){
            this.sameAs = sameAs.substring("odpt.Station:".length);
            const v = this.sameAs.split(".");
            if(v.length != 3){

                msg(`same as error 1:${sameAs} ${obj["odpt:stationTitle"]["ja"]}`);
            }
        }
        else{
            msg(`same as error 2:${sameAs} ${obj["odpt:stationTitle"]["ja"]}`);
        }
    }

    mateText(){
        SVGTextElement
    }
}

class TrainTimetable{
    timetables : Timetable[] = [];
}

class Timetable{
    station: Station;
    arrivalTime: number;
    time: number;

    constructor(station: Station, arrivalTime: number, departureTime: number){
        this.station = station;
        this.arrivalTime = arrivalTime;
        this.time = departureTime;
        if(departureTime == undefined){
            this.time = arrivalTime;
        }
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

function isNumber(obj:any): boolean {
    return (typeof obj) == "number";
}

function isNull(obj:any): boolean {
    return obj == undefined || obj == null;
}

function getStations(objs:[]){
    stations = new Map<string, Station>();
    for(let obj of objs){

        if(isNull(obj["geo:long"]) || isNull(obj["geo:lat"])){
            msg(`位置不明:${obj["odpt:stationTitle"]["ja"]}`);            
        }
        else{

            let station = new Station(obj as Station);
            stations.set(station.sameAs, station);
        }
    }

    const minX = Array.from(stations.values()).map(a => a.pos.x).reduce((a, b) => Math.min(a, b));
    const minY = Array.from(stations.values()).map(a => a.pos.y).reduce((a, b) => Math.min(a, b));

    const maxX = Array.from(stations.values()).map(a => a.pos.x).reduce((a, b) => Math.max(a, b));
    const maxY = Array.from(stations.values()).map(a => a.pos.y).reduce((a, b) => Math.max(a, b));

    ui.mapPos = new Vec2(minX, minY);
    ui.viewSize = new Vec2(maxX - minX, maxY - minY);

    ui.viewPos = new Vec2(minX, minY);
    ui.viewSize = new Vec2(maxX - minX, maxY - minY);
}

function drawStations(setDirty: boolean = true){
    const viewBottom = ui.viewPos.y + ui.viewSize.y;
    const scale = cnvSize.div(ui.viewSize);

    const scaleW = mapBox.width  / ui.viewSize.x;
    const scaleH = mapBox.height / ui.viewSize.y;
    const scaleD = 1 / (24 * 60);

    msg(`pos:(${ui.viewPos.x} ${ui.viewPos.y}) size:(${ui.viewSize.x} ${ui.viewSize.y}) scale:(${scale.x} ${scale.y})`)

    timePoints = [];
    ctx.clearRect(0, 0, cnvMap.width, cnvMap.height);

    for(let sta of stations.values()){
        let x = (sta.pos.x - ui.viewPos.x) * scale.x;
        let y = (viewBottom - sta.pos.y) * scale.y;
        if(0 <= x && x < cnvSize.x && 0 <= y && y < cnvSize.y){

            ctx.strokeText(sta.title.ja, x, y);

            msg(`${sta.title.ja} ${sta.timetables.length}`)
            for(let timetable of sta.timetables){
                // if(0.1 < Math.random()){
                //     continue;
                // }

                let x2 = mapBox.x1 + (sta.pos.x - ui.viewPos.x) * scaleW;
                let y2 = mapBox.y1 + (sta.pos.y - ui.viewPos.y) * scaleH;
                let z2 = mapBox.z1 +  timetable.time * scaleD;
                timePoints.push(new Vertex(x2, y2, z2));

                // msg(`${sta.pos.x},${sta.pos.y} => ${x2} ${y2}`)
            }
        }
    }
    msg(`timePoints:${timePoints.length}`);

    if(timeDrawable != undefined){
        timeDrawable.update(timePoints, Color.red, 5);
    }

    if(setDirty){

        const param = canvasDrawable.getParam();
        const pkg = mygpgpu.packages[param.id] as Package;
        const texInf = Array.from(pkg.textures).find(x => x instanceof TextureInfo && x.value == cnvMap) as TextureInfo;
        console.assert(texInf != undefined);
        texInf.dirty = true
    }
}

function getStation(text:string){
    if(text != undefined){
        console.assert(text.startsWith("odpt.Station:"));
        text = text.substring("odpt.Station:".length);

        if(stations.has(text)){
        }
        else{

            msg(`不明駅 ${text}`)
        }
    }

}

function trimStation(text: string): string {
    console.assert(text.startsWith("odpt.Station:"));
    return text.substring("odpt.Station:".length);
}

function getTime(prevTime: number, timeText: string) : number {
    if(timeText == undefined){
        return undefined;
    }

    let v = timeText.split(":");
    console.assert(v.length == 2);
    const hh = parseInt(v[0]);
    const mm = parseInt(v[0]);

    let hhmm = hh*60 + mm;
    if(hhmm < prevTime){
        hhmm = (24 + hh) * 60 + mm;
    }

    return hhmm;
}

function getTrainTimetables(objs:any[]){
    timetableReady = true;
    let cnt: number = 0;

    for(let obj of objs){
        if(obj["odpt:calendar"] != "odpt.Calendar:Weekday"){
            continue;
        }
        let trainTimetable = new TrainTimetable();
        let prevTime: number = 0;
        for(let data of obj["odpt:trainTimetableObject"]){
            console.assert(prevTime != undefined);

            let arrivalStation = data["odpt:arrivalStation"] as string;
            let departureStation = data["odpt:departureStation"] as string;
            
            let station: Station;
            if(arrivalStation != undefined){
                station = stations.get(trimStation(arrivalStation));
            }
            else{

                station = stations.get(trimStation(departureStation));
            }
            console.assert(station != undefined);

            let arrivalTime   = getTime(prevTime, data["odpt:arrivalTime"]);
            let departureTime = getTime(prevTime, data["odpt:departureTime"]);
            
            let timetable = new Timetable(station, arrivalTime, departureTime);
            station.timetables.push(timetable)
            trainTimetable.timetables.push( timetable );

            prevTime = departureTime;

            cnt++;
        }
    }

    msg(`列車時刻表 ${cnt}`);
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
                ui.viewPos.x -= scaledDiff.x;
                ui.viewPos.y += scaledDiff.y;

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

export function initJikuRyoko(){
    ui = new UI();

    fetchJson("json/Operators.json", (objs:any[])=>{ 
        operators = objs.map(x => new Operator(x));
    });

    fetchJson("json/Railways.json", (objs:any[])=>{
        railways = objs.map(x => new Railway(x));
    });

    fetchJson("json/Stations.json", getStations);

    fetchJson("json/TrainTimetable.json", getTrainTimetables);

    const timerId = setInterval(function(){
        if(operators == undefined || railways == undefined || stations == undefined || ! timetableReady){
            return;
        }

        clearInterval(timerId);

        canvasDrawable = new CanvasDrawable(cnvMap);

        var webGlCanvas = document.getElementById("webgl-canvas") as HTMLCanvasElement;
    
        mygpgpu = CreateGPGPU(webGlCanvas, ui);

        drawStations(false);
        timeDrawable = new Points(timePoints, Color.red, 5);

        mygpgpu.startDraw3D([ 
            canvasDrawable,
            timeDrawable
        ]);
    }, 100);

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

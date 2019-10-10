namespace jikuryoko {

export function getData(param: string){
    const url = `https://api-tokyochallenge.odpt.org/api/v4/${param}acl:consumerKey=f8a426086fae1ea48b8b0dd269709363c2a2ceb385d8f80bcdc5a4927cabcdc8`;
    console.log(`req:${url}`)

    fetch(encodeURI(url))
    .then((res: Response) => {
        return res.json();
    })
    .then(response => {
        console.log(`OK:${response.length}`);
        for(let obj of response){
            console.log(`${JSON.stringify(obj)}\n`);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

export function bodyOnLoad(){
    getData("odpt:Station?odpt:operator=odpt.Operator:Keio&")
}    

export function paramOnClick(){
    const text = (document.getElementById("txt-param") as HTMLInputElement).value;
    getData(text);
}

export function btnClick(){
    const src = window.event.srcElement as HTMLInputElement;
    getData(src.value);
}    

}


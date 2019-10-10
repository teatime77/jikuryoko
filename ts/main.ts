namespace jikuryoko {

// declare let $:any;    

let cnt = 0;

// function getCors(url:string){
//     cnt++;
//     console.log(`cors : ${cnt} ${url}`)

//     fetch(url)
//     .then((res: Response) => {
//         if(cnt < 3 && res.type == "cors" && res.url != undefined){
//             getCors(res.url);
//         }
//         else{
//             return res.json();
//         }
//     })
//     .then(response => {
//         console.log('Success:', JSON.stringify(response));
//     })
//     .catch(error => {
//         console.error('Error:', error);
//     });

// }

export function getData(param: string){    // , opt:string
    // const url = `https://api-tokyochallenge.odpt.org/api/v4/${param}?${opt}acl:consumerKey=f8a426086fae1ea48b8b0dd269709363c2a2ceb385d8f80bcdc5a4927cabcdc8`;
    const url = `https://api-tokyochallenge.odpt.org/api/v4/${param}acl:consumerKey=f8a426086fae1ea48b8b0dd269709363c2a2ceb385d8f80bcdc5a4927cabcdc8`;
    console.log(`req:${url}`)
    // const url = `https://api-tokyochallenge.odpt.org/api/v4/odpt:Station.json?acl:consumerKey=ACL_CONSUMERKEY`

    // fetch(url).then(function(response) {
    //     return response.json();
    // })
    // .then(function(json) {
    //     // jsonにJSONオブジェクトで結果が渡される
    //     console.log(`${json}`)
    // })
    // .catch(error => {
    //     console.error('Error:', error);
    // });

    fetch(encodeURI(url)
    //     , {
    //     method: "GET",
    //     mode: "cors"
    // }
    )
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


// function getData2(param: string){
//     const url = `https://api-tokyochallenge.odpt.org/api/v4/${param}?acl:consumerKey=f8a426086fae1ea48b8b0dd269709363c2a2ceb385d8f80bcdc5a4927cabcdc8`;
//     console.log(`req:${url}`)

//     $.ajax({
//         url:url,
//         type:'GET'
//     })
//     // Ajaxリクエストが成功した時発動
//     .done( (data) => {
//         // $('.result').html(data);
//         console.log(data);
//     })
//     // Ajaxリクエストが失敗した時発動
//     .fail( (data) => {
//         // $('.result').html(data);
//         console.log(data);
//     })
//     // Ajaxリクエストが成功・失敗どちらでも発動
//     .always( (data) => {

//     });
// }

// 京王の駅
// https://api-tokyochallenge.odpt.org/api/v4/odpt:Station?odpt:operator=odpt.Operator:Keio&acl:consumerKey=f8a426086fae1ea48b8b0dd269709363c2a2ceb385d8f80bcdc5a4927cabcdc8

// JR東日本の駅
// https://api-tokyochallenge.odpt.org/api/v4/odpt:Station?odpt:operator=odpt.Operator:JR-East&acl:consumerKey=f8a426086fae1ea48b8b0dd269709363c2a2ceb385d8f80bcdc5a4927cabcdc8



// https://api-tokyochallenge.odpt.org/api/v4/odpt:Station.json?acl:consumerKey=f8a426086fae1ea48b8b0dd269709363c2a2ceb385d8f80bcdc5a4927cabcdc8
// https://api-tokyochallenge.odpt.org/api/v4/odpt:Operator.json?acl:consumerKey=f8a426086fae1ea48b8b0dd269709363c2a2ceb385d8f80bcdc5a4927cabcdc8
// https://api-tokyochallenge.odpt.org/api/v4/odpt:TrainTimetable.json?acl:consumerKey=f8a426086fae1ea48b8b0dd269709363c2a2ceb385d8f80bcdc5a4927cabcdc8

export function bodyOnLoad(){
    // getData("odpt:Operator.json", "");
    // getData("odpt:Train", "odpt.Operator=odpt.Operator:Toei&");
    // getData("odpt:Train", "");
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


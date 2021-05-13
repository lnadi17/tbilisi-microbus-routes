const fs = require('fs');
const jsonic = require('jsonic');

function parseJson(data) {
    let firstPart = data.split('{').slice(1).join('{');
    let secondPart = firstPart.split('}');
    secondPart.pop();
    let thirdPart = secondPart.join('}');
    let responseJson = "{" + thirdPart + "}";
    return jsonic(responseJson);
}

function parseInfo(data) {
    return data.replace('\n', '').replace(/<(.+?)>/gms, ';;').split(';;').map((item) => {
        let newItem = item.replace(/\s\s+/g, ' ');
        return newItem.trim();
    });
}

function parseRouteNumber(currentNumber) {
    let formattedJson = {};

    fs.readFile(`postman-data/${currentNumber}_to.json`, 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return;
        }
        let realJson = parseJson(data);

        formattedJson.number = realJson.n;
        formattedJson.price = realJson.price;
        formattedJson.toTravelTime = realJson.tim;
        formattedJson.distance = realJson.size;
        formattedJson.workDays = realJson.d_t;
        formattedJson.weekends = realJson.su_t;
        formattedJson.toCheckpoints = parseInfo(realJson.info);

        fs.readFile(`postman-data/${currentNumber}_from.json`, 'utf8', (err, data) => {
            if (err) {
                console.error(err);
                return;
            }
            let realJson = parseJson(data);

            formattedJson.fromTravelTime = realJson.tim;
            formattedJson.fromCheckpoints = parseInfo(realJson.info);
            console.log(formattedJson);
        });
    });
}

parseRouteNumber(41);
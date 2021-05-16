const fs = require('fs');
const jsonic = require('../node_modules/jsonic');

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

function parseLines(lines) {
    let parsedLines = [];
    for (let i = 0; i < lines.length; i += 2) {
        let x = parseFloat(lines[i].split('(')[1]);
        let y = parseFloat(lines[i + 1].split(')')[0]);
        let converter = map.getProjection().fromPointToLatLng(new google.maps.Point(x, y));
        let lat = converter.lat();
        let lng = converter.lng();
        let latLngObject = {lat: lat, lng: lng};
        parsedLines.push(latLngObject);
    }
    return parsedLines;
}

function parseRouteNumber(map, stream, currentNumber) {
    let formattedJson = {};

    fs.readFile(`../postman-data/${currentNumber}_to.json`, 'utf8', (err, toData) => {
        if (err) {
            console.log(err);
            return;
        }
        if (toData.length < 50) {
            console.log(`skipping #${currentNumber}, file content too short.`);
            return;
        }
        fs.readFile(`../postman-data/${currentNumber}_from.json`, 'utf8', (err, fromData) => {
            if (err) {
                console.log(err);
                return;
            }
            let to = parseJson(toData);
            let from = parseJson(fromData);

            formattedJson.number = to.n;
            formattedJson.price = to.price;
            formattedJson.toTravelTime = to.tim;
            formattedJson.fromTravelTime = from.tim;
            formattedJson.distance = to.size;
            formattedJson.workDays = to.d_t;
            formattedJson.weekends = to.su_t;
            formattedJson.toCheckpoints = parseInfo(to.info);
            formattedJson.fromCheckpoints = parseInfo(from.info);
            formattedJson.toRoute = parseLines(to.lines);
            formattedJson.fromRoute = parseLines(from.lines);
            stream.write(JSON.stringify(formattedJson) + ',\n');
            drawRoute(map, formattedJson.toRoute);
        });
    });
}

function drawRoute(map, lines) {
    const route = new google.maps.Polyline({
        path: lines,
        geodesic: true,
        strokeColor: "#ff0000",
        strokeOpacity: 0.5,
        strokeWeight: 2,
    });
    route.setMap(map);
}

function getRandomColor() {
    let letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function parseAllData(map) {
    // Output is not a valid JSON, you must add square brackets around the text and remove the last comma
    let stream = fs.createWriteStream("../output.json", {flags:'a'});
    for (let i = 1; i <= 500; i++) {
        console.log(`parsing #${i}`)
        parseRouteNumber(map, stream, i);
    }
}
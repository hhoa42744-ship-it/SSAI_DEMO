const express = require('express');
const fs = require('fs');
const xml2js = require('xml2js');
const app = express();

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.use('/vod_output', express.static('./vod_output'));
app.use('/ad_output', express.static('./ad_output'));

app.get('/manifest.mpd', async (req, res) => {
    try {
        const parser = new xml2js.Parser();
        const builder = new xml2js.Builder();

        let vodRaw = fs.readFileSync('./vod_output/manifest.mpd', 'utf-8');
        let adRaw = fs.readFileSync('./ad_output/manifest_ad.mpd', 'utf-8');

        const vodJson = await parser.parseStringPromise(vodRaw);
        const adJson = await parser.parseStringPromise(adRaw);

        let mainPeriod = vodJson.MPD.Period[0];
        let adPeriod = adJson.MPD.Period[0];

        mainPeriod.$.id = "program_period_1";
        adPeriod.$.id = "ad_period_1";

        mainPeriod.BaseURL = ["vod_output/"];
        adPeriod.BaseURL = ["ad_output/"];

        // 1. Video chính: 43 giây
        mainPeriod.$.start = "PT0H0M0.00S";
        mainPeriod.$.duration = "PT0H0M43.00S";

        // 2. Video Quảng cáo: 26 giây (bắt đầu từ giây thứ 43)
        adPeriod.$.start = "PT0H0M43.00S";
        adPeriod.$.duration = "PT0H0M26.00S";

        // 3. Tổng thời lượng = 1 phút 09 giây (69s)
        vodJson.MPD.$.mediaPresentationDuration = "PT0H1M09.00S";

        // Ghép 2 Period
        vodJson.MPD.Period = [mainPeriod, adPeriod];

        const xml = builder.buildObject(vodJson);
        res.header('Content-Type', 'application/dash+xml');
        res.send(xml);
    } catch (error) {
        console.error("Lỗi Server:", error);
        res.status(500).send("SSAI Server Error");
    }
});

app.listen(3000, () => console.log('SSAI Server dang chay tai: http://localhost:3000'));
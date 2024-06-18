import { JSDOM } from 'jsdom';
import { readFile, writeFile } from 'fs';

//把title改成id
// readFile('Taiwan_referendum_16_map.svg', 'utf8', function(err, data) {
//     if (err) {
//         console.error(err);
//         return;
//     }

//     const dom = new JSDOM(data);
//     const document = dom.window.document;

//     const paths = document.querySelectorAll('path');

//     paths.forEach(path => {
//         const title = path.querySelector('title');
//         if (title) {
//             // Keep only Chinese characters in the title content
//             const chineseTitle = title.textContent.match(/[\u4e00-\u9fa5]+/g).join('');
//             path.id = chineseTitle.trim().replace(/\s+/g, '-');
//             path.removeChild(title);
//         }
//     });

//     writeFile('Taiwan_referendum_16_map.svg', dom.serialize(), function(err) {
//         if (err) {
//             console.error(err);
//         } else {
//             console.log('SVG file has been updated');
//         }
//     });
// });

const taipei = ["松山區", "信義區", "大安區", "中山區", "中正區", "大同區", "萬華區", "文山區", "南港區", "內湖區", "士林區", "北投區"];
const newTaipei = [
    "板橋區", "三重區", "中和區", "永和區", "新莊區", "新店區", "樹林區", "鶯歌區", "三峽區", "淡水區",
    "汐止區", "瑞芳區", "土城區", "蘆洲區", "五股區", "泰山區", "林口區", "深坑區", "石碇區", "坪林區",
    "三芝區", "石門區", "八里區", "平溪區", "雙溪區", "貢寮區", "金山區", "萬里區", "烏來區"
];



readFile('Taiwan_referendum_16_map.svg', 'utf8', function (err, data) {
    if (err) {
        console.error(err);
        return;
    }
    // Create a new JSDOM instance
    const orgDom = new JSDOM(data);
    const newDom = new JSDOM(`<!DOCTYPE html><body></body>`);

    // Get the document object
    const document = orgDom.window.document;


    const paths = document.querySelectorAll('path');


    // Create a new SVG group element
    const newGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    newGroup.setAttribute('id', 'nweTaipei');
    newGroup.setAttribute('stroke', '#000');
    newGroup.setAttribute('stroke-width', '.2')

    newTaipei.forEach(district => {
        paths.forEach(path => {
            const title = path.id.split('-')[1];
            if (title && district === title) {
                // path.setAttribute('fill', '#89CFF0');
                // path.id = '新北市-' + title;
                newGroup.appendChild(path);
            }
        });
    });

    writeFile('./resource/newTaipei.svg', newGroup.outerHTML, function (err) {
        if (err) {
            console.error(err);
        } else {
            console.log('SVG file has been updated');
        }
    });
});
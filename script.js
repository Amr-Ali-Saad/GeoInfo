"use strict";

const btn = document.querySelector(".btn-country");
const countriesContainer = document.querySelector(".countries");

///////////////////////////////////////
function countryStructure(data, neighbour = false, locaition) {
    let html = `
            <article class="country ${neighbour ? "neighbour" : ""}">
            <img class="country__img" src="${data.flags.svg}" alt="${
        data.flags.alt
    }" />
            <div class="country__data"> 
                <h3 class="country__name">${data.name.common}</h3>
                <h4 class="country__region">${data.region}</h4>
                <p class="country__row"><span>👫</span>${(
                    +data.population / 1000000
                ).toFixed(1)} people</p>
                <p class="country__row"><span>🗣️</span>${
                    data.languages[Object.keys(data.languages)[0]]
                }</p>
                <p class="country__row"><span>💰</span>${Object.entries(
                    data.currencies
                )
                    .map(curr => curr[1].name)
                    .join(", <br>")}</p>
                ${
                    locaition
                        ? `<p class="country__row"><span>🗺️</span>${locaition}</p>`
                        : ``
                }
                    </div>
                    </article>
                    `;
    countriesContainer.insertAdjacentHTML("beforeend", html);
    countriesContainer.style.opacity = 1;
    console.log(data.name.common, data);
    return html;
}
function AJAXCountryData(country, neighbour = false) {
    let request = new XMLHttpRequest();
    request.open("GET", `https://restcountries.com/v3.1/name/${country}`);
    request.send();
    request.addEventListener("load", function () {
        let [data] = JSON.parse(this.responseText);
        if (data.cca3 != "ISR") {
            countryStructure(data);
            // Get neighbour country:
            if (neighbour) {
                data.borders?.forEach(con => {
                    if (con != "ISR") {
                        let request2 = new XMLHttpRequest();
                        request2.open(
                            "GET",
                            `https://restcountries.com/v3.1/alpha/${con}`
                        );
                        request2.send();
                        request2.addEventListener("load", function () {
                            let [neighbourData] = JSON.parse(this.responseText);
                            countryStructure(neighbourData, true);
                        });
                    }
                });
            }
            return data;
        }
    });
}
function fetchCountryDataOldMCB(country, neighbour = false) {
    fetch(`https://restcountries.com/v3.1/name/${country}`)
        .then(response => response.json())
        .then(data => {
            if (data[0].cca3 != "ISR") {
                countryStructure(data[0]);
                if (neighbour) {
                    data[0].borders?.forEach(con => {
                        if (con != "ISR") {
                            fetch(`https://restcountries.com/v3.1/alpha/${con}`)
                                .then(response => response.json())
                                .then(data => {
                                    let [neighbourData] = data;
                                    countryStructure(neighbourData, true);
                                });
                        }
                    });
                }
            }
        });
}
function getJSON(url, errMsg = "Something went wrong") {
    return fetch(url).then(response => {
        if (!response.ok) {
            console.error(`${errMsg} (${response.status})`);
            throw new Error(`${errMsg} (${response.status})`);
        }

        return response.json();
    });
}
function fetchCountryDataONB(country, neighbour = false) {
    getJSON(
        `https://restcountries.com/v3.1/name/${country}`,
        `Country not found`
    )
        .then(data => {
            if (data[0].cca3 == "ISR") return;
            countryStructure(data[0]);

            if (!neighbour) return;

            // let borderCon = data[0].borders?.[0];
            if (data[0].borders?.[0] == "ISR") {
                return getJSON(
                    `https://restcountries.com/v3.1/alpha/${data[0].borders?.[1]}`,
                    `No neighbour found"`
                );
            } else if (data[0].borders?.[0] !== "ISR") {
                return getJSON(
                    `https://restcountries.com/v3.1/alpha/${data[0].borders?.[0]}`,
                    `No neighbour found`
                );
            } else if (!data[0].borders[0])
                throw new Error("No neighbour found");
        })
        .then(data => {
            countryStructure(data[0], true);
        })
        .catch(err =>
            renderError(`Something went wrong ${err.message}, Try again!`)
        )
        .finally(() => {
            countriesContainer.style.opacity = 1;
        });
}
function renderError(msg) {
    countriesContainer.innerHTML = `<p class="error">${msg}</p><br>`;
    countriesContainer.style.opacity = 1;
}
function simpleRenderCountry(country) {
    getJSON(
        `https://restcountries.com/v3.1/name/${country}`,
        "Country not found"
    ).then(data => {
        console.log(data[0]);
        countryStructure(data[0]);
        countriesContainer.style.opacity = 1;
    });
}
function whereAmI(lat, lon) {
    myCountry()
        .then(pos => {
            let { latitude: lat, longitude: lon } = pos.coords;
            return fetch(
                `https://nominatim.openstreetmap.org/reverse?format=geojson&lat=${lat}&lon=${lon}`
            );
        })
        .then(response => {
            if (!response.ok) {
                console.error(`${errMsg} (${response.status})`);
                throw new Error(`${errMsg} (${response.status})`);
            }
            return response.json();
        })
        .then(data => {
            let country = data.features[0].properties.display_name
                .split(", ")
                .slice(-1)[0];
            // console.log(country);
            simpleRenderCountry(country);
        })
        .catch(err => {
            console.error(`${err.message}`);
            countriesContainer.insertAdjacentText(
                "beforeend",
                `Something went wrong ${err.message}, Try again!`
            );
        });
}
function myCountry() {
    return new Promise(function (resolve, reject) {
        // if (navigator.geolocation) {
        //     navigator.geolocation.getCurrentPosition(
        //         position => {
        //             let { latitude } = position.coords;
        //             let { longitude } = position.coords;
        //             whereAmI(latitude, longitude);
        //             resolve(position)
        //         },
        //         err => reject(`Couldn't not get your position: ${err}`)
        //     );
        // }
        navigator.geolocation.getCurrentPosition(resolve, reject);
        console.log(`Getting position...`);
    });
}

// Waiting fn, competition promise:
/*
// let competition = new Promise(function (resolve, reject) {
//     console.log("wait..");
//     setTimeout(() => {
//         if (Math.random() >= 0.5) {
//             resolve("U won");
//         } else {
//             reject("U lost your money");
//         }
//     }, 2000);
// });
// competition.then(res => console.log(res)).catch(err => console.error(err));
// function wait(sec){
//     return new Promise(function(resolve){
//         setTimeout(resolve,sec* 1000)
//     })
// }
// wait(2).then((res)=> {
//     console.log("waited 2 sec");
//     return wait(1)
// }).then(()=> console.log("waited 1 sec"))
*/

// Async/Await
async function whereAmINew() {
    try {
        let pos = await myCountry();
        let { latitude: lat, longitude: lon } = pos.coords;
        let resGeo = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=geojson&lat=${lat}&lon=${lon}`, 
            { headers: { 'Accept-Language': 'en-US,en;q=0.9' } }
        );
        if (!resGeo.ok) throw new Error(`reading your coordinates`);

        let dataGeo = await resGeo.json();
        console.log(dataGeo);
        let curCountry = dataGeo.features[0].properties.display_name
            .split(", ")
            .slice(-1)[0];
        let response = await fetch(
            `https://restcountries.com/v3.1/name/${curCountry}`
        );
        if (!response.ok) throw new Error(`getting your country`);
        let data = await response.json();
        countryStructure(
            data[0],
            false,
            dataGeo.features[0].properties.display_name
        );
        return `You are in ${dataGeo.features[0].properties.display_name}`;
    } catch (err) {
        renderError(
            `⚠ A problem happened : ${err.message}, Please slowly reload the page or <a target = "_blank" href="https://discordapp.com/users/882452170631421993">contact with the developer</a>..`
        );
        // throw err;
    }
}

// (async () => {
//     console.log(`1: Getting locaition`)
//     try {
//         let city = await whereAmINew();
//         console.log(`2: `, city);
//     } catch (err) {
//         console.log(`2: `, err);
//     }
//     console.log(`3: Finished!`);
// })();

btn.addEventListener("click", function (e) {
    whereAmINew();
    // fetchCountryDataONB("ps", true);
});

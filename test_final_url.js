const url = "https://script.google.com/macros/s/AKfycbyF3b7w_68PhjSdYinlu2RvMg454ItFAhrXOfvKcCAU4dsECEPTnhfnV3sLUGPxW3ZIww/exec";

const params = new URLSearchParams();
params.append('name', 'GeminiTester');
params.append('time', '01:23');

fetch(url, {
  method: "POST",
  body: params
})
  .then(res => res.json())
  .then(data => {
    console.log("POST Response:", data);
    
    // Now test GET
    return fetch(url + "?action=getTop3");
  })
  .then(res => res.json())
  .then(data => console.log("GET Response:", data))
  .catch(err => console.error("Error:", err));

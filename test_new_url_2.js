const url = "https://script.google.com/macros/s/AKfycbx2fQSnm0Dsb08dfQzRmQZUKpHmD8b9iE5HNPsYaJBPivF_cL-yW5Ls2A-FAuI8dmPSVQ/exec";

// Test GET
fetch(url + "?action=getTop3")
  .then(res => res.text())
  .then(text => console.log("GET Response:", text))
  .catch(err => console.error("GET Error:", err));

// Test POST
const params = new URLSearchParams();
params.append('name', 'NodeTestForm');
params.append('time', '01:00');

fetch(url, {
  method: "POST",
  body: params
})
  .then(res => res.text())
  .then(text => console.log("POST Response:", text))
  .catch(err => console.error("POST Error:", err));

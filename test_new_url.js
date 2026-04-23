const params = new URLSearchParams();
params.append('name', 'TestPlayer');
params.append('time', '01:05');

fetch("https://script.google.com/macros/s/AKfycbx2fQSnm0Dsb08dfQzRmQZUKpHmD8b9iE5HNPsYaJBPivF_cL-yW5Ls2A-FAuI8dmPSVQ/exec", {
  method: "POST",
  body: params
})
  .then(res => res.text())
  .then(text => console.log("Response:", text))
  .catch(err => console.error("Error:", err));

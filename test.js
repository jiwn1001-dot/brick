fetch("https://script.google.com/macros/s/AKfycbzvfwu0Hrw_UOqpEz00BKDgmKwo5evYEdAWP6qK03oH5Qmx2fjnwmm3bVe5u2nXvuIpwg/exec", {
  method: "POST",
  body: JSON.stringify({ name: "NodeTestJSON", time: "01:00" })
}).then(r => r.text()).then(t => console.log("JSON Response:", t)).catch(console.error);

const params = new URLSearchParams();
params.append('name', 'NodeTestForm');
params.append('time', '01:00');

fetch("https://script.google.com/macros/s/AKfycbzvfwu0Hrw_UOqpEz00BKDgmKwo5evYEdAWP6qK03oH5Qmx2fjnwmm3bVe5u2nXvuIpwg/exec", {
  method: "POST",
  body: params
}).then(r => r.text()).then(t => console.log("Form Response:", t)).catch(console.error);

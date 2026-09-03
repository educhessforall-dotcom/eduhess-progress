// Privileged certificate issuance.
// Validate approved promotion, generate certificate number + random token,
// generate/store PDF, and append an ISSUED event.
Deno.serve(async () => new Response(JSON.stringify({
  ok:false, message:"Implement certificate issuance."
}), {status:501,headers:{"content-type":"application/json"}}));

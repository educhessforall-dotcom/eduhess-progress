// Public verification endpoint.
// Production: validate token via the verify_certificate RPC and rate-limit requests.
Deno.serve(async () => new Response(JSON.stringify({
  ok:false, message:"Implement public verification endpoint."
}), {status:501,headers:{"content-type":"application/json"}}));

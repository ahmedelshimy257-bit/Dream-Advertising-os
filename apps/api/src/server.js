import { createServer } from "node:http";
import { PolicyLoader } from "../../../packages/policy-loader/src/policy-loader.js";
const root = process.env.POLICY_ROOT || process.cwd();
createServer(async (req,res) => {
  if (req.method === "GET" && req.url === "/health") { res.writeHead(200,{"content-type":"application/json"}); return res.end(JSON.stringify({status:"ok"})); }
  if (req.method === "GET" && req.url === "/policy-bundle") { const bundle=await new PolicyLoader(root).load(); res.writeHead(bundle.status==="ACTIVE"?200:409,{"content-type":"application/json"}); return res.end(JSON.stringify(bundle)); }
  res.writeHead(404).end();
}).listen(process.env.PORT || 3000, () => console.log("Dream Advertising OS runtime API listening"));


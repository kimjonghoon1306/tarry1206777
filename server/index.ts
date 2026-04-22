import express, { type Request, type Response } from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { readdirSync, existsSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

async function registerApiRoutes(app: express.Express) {
  const apiDir = path.resolve(projectRoot, "api");
  if (!existsSync(apiDir)) return;

  const files = readdirSync(apiDir).filter((f) => f.endsWith(".js"));
  for (const file of files) {
    const route = "/api/" + file.replace(/\.js$/, "");
    const modUrl = pathToFileURL(path.join(apiDir, file)).href;
    try {
      const mod = await import(modUrl);
      const handler = mod.default;
      if (typeof handler !== "function") {
        console.warn(`Skipping ${file}: no default export function`);
        continue;
      }
      app.all(route, async (req: Request, res: Response) => {
        try {
          await handler(req, res);
        } catch (err: any) {
          console.error(`Handler error in ${file}:`, err);
          if (!res.headersSent) {
            res.status(500).json({ error: err?.message || "Internal error" });
          }
        }
      });
      console.log(`Registered ${route}`);
    } catch (err) {
      console.error(`Failed to load ${file}:`, err);
    }
  }
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.use(express.json({ limit: "20mb" }));
  app.use(express.urlencoded({ extended: true, limit: "20mb" }));

  await registerApiRoutes(app);

  const isProd = process.env.NODE_ENV === "production";

  if (isProd) {
    const staticPath = path.resolve(projectRoot, "dist", "public");
    app.use(express.static(staticPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(staticPath, "index.html"));
    });
  } else {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      configFile: path.resolve(projectRoot, "vite.config.ts"),
      server: { middlewareMode: true, hmr: { server } },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${port}/`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

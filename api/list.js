export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const branch = process.env.GITHUB_BRANCH || "main";
    const path = process.env.GITHUB_FILE_PATH || "data/shopping-list.json";
    const token = process.env.GITHUB_TOKEN;

    if (!owner || !repo || !token) {
      return res.status(500).json({
        error: "Missing GITHUB_OWNER, GITHUB_REPO, or GITHUB_TOKEN environment variables."
      });
    }

    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(branch)}`;

    const ghRes = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    if (!ghRes.ok) {
      return res.status(200).json({ items: [] });
    }

    const data = await ghRes.json();
    const decoded = Buffer.from(data.content, "base64").toString("utf8");
    const parsed = JSON.parse(decoded);

    return res.status(200).json({
      items: Array.isArray(parsed.items) ? parsed.items : [],
    });
  } catch (error) {
    return res.status(200).json({ items: [] });
  }
}
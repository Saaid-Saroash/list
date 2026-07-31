export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      items = [],
    } = req.body || {};

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

    const content = JSON.stringify({ items }, null, 2);
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`;

    let sha = undefined;
    const existing = await fetch(`${apiUrl}?ref=${encodeURIComponent(branch)}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    if (existing.ok) {
      const data = await existing.json();
      sha = data.sha;
    }

    const putRes = await fetch(apiUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Update shopping list",
        content: Buffer.from(content).toString("base64"),
        branch,
        ...(sha ? { sha } : {}),
      }),
    });

    const result = await putRes.json();

    if (!putRes.ok) {
      return res.status(500).json({
        error: "GitHub save failed",
        details: result,
      });
    }

    return res.status(200).json({
      ok: true,
      path,
      branch,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Server error",
      details: String(error?.message || error),
    });
  }
}
(() => {
  if (document.getElementById("scam-alert-card")) return;

  const card = document.createElement("div");
  card.id = "scam-alert-card";

  card.innerHTML = `
    <div class="header">
      <div class="title">
        🛡️ <span>Low Risk Detected</span>
      </div>
      <button class="close">×</button>
    </div>

    <div class="desc">
      This website shows minimal risk indicators based on our analysis.
    </div>

    <div class="score">
      <div class="label">
        <span>Risk Score</span>
        <span class="value">8/100</span>
      </div>
      <div class="bar">
        <div class="fill"></div>
      </div>
    </div>
  `;

  const style = document.createElement("style");
  style.textContent = `
    #scam-alert-card {
      position: fixed;
      top: 20px;
      right: 20px;
      width: 340px;
      padding: 16px;
      background: #ecfdf5;
      border: 1px solid #22c55e;
      border-radius: 14px;
      font-family: system-ui, -apple-system, BlinkMacSystemFont;
      color: #065f46;
      z-index: 999999;
      box-shadow: 0 10px 25px rgba(0,0,0,0.15);
      animation: slideIn 0.35s ease;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    #scam-alert-card .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    #scam-alert-card .title {
      font-weight: 600;
      font-size: 15px;
      display: flex;
      gap: 6px;
      align-items: center;
    }

    #scam-alert-card .close {
      border: none;
      background: transparent;
      font-size: 18px;
      cursor: pointer;
      color: #065f46;
    }

    #scam-alert-card .desc {
      font-size: 13px;
      margin: 8px 0 14px;
      line-height: 1.4;
    }

    #scam-alert-card .score .label {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      margin-bottom: 6px;
    }

    #scam-alert-card .bar {
      height: 6px;
      background: #d1fae5;
      border-radius: 6px;
      overflow: hidden;
    }

    #scam-alert-card .fill {
      width: 8%;
      height: 100%;
      background: #22c55e;
      border-radius: 6px;
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(card);

  // Close button
  card.querySelector(".close").onclick = () => card.remove();

  // Auto close after 6 seconds
  setTimeout(() => {
    card.style.opacity = "0";
    card.style.transform = "translateY(-10px)";
    card.style.transition = "opacity 0.3s ease, transform 0.3s ease";
    setTimeout(() => card.remove(), 300);
  }, 6000);
})();

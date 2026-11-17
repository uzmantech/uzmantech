(() => {
  const ID = "uzman-asistan-parent-mascot";
  const STYLE_ID = "uzman-asistan-launcher-fix-style";
  const OVERLAY_ID = "uzman-chat-overlay";

  function install() {
    if (!document.body) return;

    if (!document.getElementById(STYLE_ID)) {
      const style = document.createElement("style");
      style.id = STYLE_ID;
      style.textContent = `
        #${ID} {
          position: fixed !important;
          right: 14px !important;
          bottom: 14px !important;
          z-index: 2147483002 !important;
          display: grid !important;
          place-items: center !important;
          width: 112px !important;
          height: 142px !important;
          padding: 0 !important;
          margin: 0 !important;
          border: 0 !important;
          background: transparent !important;
          box-shadow: none !important;
          cursor: pointer !important;
          visibility: visible !important;
          opacity: 1 !important;
          pointer-events: auto !important;
        }
        #${ID} svg, #${ID} img {
          display: block !important;
          width: 100% !important;
          height: 100% !important;
          object-fit: contain !important;
        }
        #${OVERLAY_ID} {
          position: fixed !important;
          inset: 0 !important;
          z-index: 2147483001 !important;
        }
        #${OVERLAY_ID} .uz-chat-backdrop {
          position: absolute !important;
          inset: 0 !important;
          width: 100% !important;
          height: 100% !important;
          border: 0 !important;
          background: rgba(3, 12, 24, .22) !important;
        }
        #${OVERLAY_ID} .uz-chat-frame-wrap {
          position: absolute !important;
          right: 18px !important;
          bottom: 18px !important;
          width: min(460px, calc(100vw - 24px)) !important;
          height: min(700px, calc(100dvh - 30px)) !important;
          border: 1px solid #00cfe6 !important;
          border-radius: 16px !important;
          overflow: hidden !important;
          background: #071321 !important;
          box-shadow: 0 18px 65px #000b !important;
        }
        #${OVERLAY_ID} iframe {
          display: block !important;
          width: 100% !important;
          height: 100% !important;
          border: 0 !important;
        }
        #${OVERLAY_ID} .uz-chat-close {
          position: absolute !important;
          right: 8px !important;
          top: 7px !important;
          z-index: 3 !important;
          width: 30px !important;
          height: 30px !important;
          border: 1px solid #27718a !important;
          border-radius: 50% !important;
          background: #08283b !important;
          color: #fff !important;
          font-size: 20px !important;
          cursor: pointer !important;
        }
        @media(max-width:560px) {
          #${ID} { width: 88px !important; height: 116px !important; right: 4px !important; bottom: 4px !important; }
          #${OVERLAY_ID} .uz-chat-frame-wrap {
            right: 0 !important; bottom: 0 !important; width: 100vw !important;
            height: min(720px, 100dvh) !important; border-radius: 14px 14px 0 0 !important;
          }
        }`;
      document.head.appendChild(style);
    }

    let launcher = document.getElementById(ID);
    if (!launcher) {
      launcher = document.createElement("button");
      launcher.id = ID;
      launcher.type = "button";
      launcher.setAttribute("aria-label", "UZMAN ASİSTAN sohbetini aç");
      launcher.title = "UZMAN ASİSTAN";
      launcher.innerHTML = '<img src="/assets/images/uzman-mascot-transparent.webp" alt="UZMAN ASİSTAN" />';
      document.body.appendChild(launcher);
      launcher.addEventListener("click", openChat);
    } else if (!launcher.dataset.assistantFallbackBound) {
      // The shared navigation script normally owns the click handler. Its button is retained.
      launcher.dataset.assistantFallbackBound = "1";
    }
    launcher.style.setProperty("visibility", "visible", "important");
  }

  function openChat() {
    if (document.getElementById(OVERLAY_ID)) return;
    const overlay = document.createElement("div");
    overlay.id = OVERLAY_ID;
    overlay.innerHTML = '<button type="button" class="uz-chat-backdrop" aria-label="Sohbeti kapat"></button><section class="uz-chat-frame-wrap" role="dialog" aria-label="UZMAN ASİSTAN sohbeti"><button type="button" class="uz-chat-close" aria-label="Sohbeti kapat">×</button><iframe title="UZMAN ASİSTAN" src="/uzman-asistan.html?widget=1&v=assistant-fallback-20261117-1" allow="clipboard-read; clipboard-write"></iframe></section>';
    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    overlay.querySelector(".uz-chat-close").addEventListener("click", close);
    overlay.querySelector(".uz-chat-backdrop").addEventListener("click", close);
    const frame = overlay.querySelector("iframe");
    window.addEventListener("message", function onAssistantMessage(event) {
      if (event.source === frame.contentWindow && event.data?.type === "uzman-asistan-close") {
        close();
        window.removeEventListener("message", onAssistantMessage);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install, { once: true });
  } else {
    install();
  }
})();
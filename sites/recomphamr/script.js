const copyButtons = document.querySelectorAll('[data-copy]');

copyButtons.forEach((button) => {
  button.addEventListener('click', async () => {
    const value = button.getAttribute('data-copy');
    const original = button.textContent;

    try {
      await navigator.clipboard.writeText(value);
      button.textContent = 'Copied';
      setTimeout(() => { button.textContent = original; }, 1400);
    } catch (error) {
      button.textContent = 'Select text';
      setTimeout(() => { button.textContent = original; }, 1400);
    }
  });
});

const terminal = document.querySelector('#terminal-output code');
const states = [
`$ recomphamr
loading .rehamr/config.yaml
active profile: lmstudio-amd
skills: n64-re, xbox360-re, windows-game-re
mcp: ghidra registered · n64-debug registered

/rehamr > /init-re
created .rehamr/REPHAMR_STATE.md
mode: evidence-first
status: ready to audit, trace, verify`,
`/rehamr > /doctor
checking endpoint: http://localhost:1234
checking GPU profile: amd-priority
checking git: ok
checking ghidra MCP: registered
checking workspace: ok

result: verified where runnable
unknowns: marked unverified`,
`/rehamr > /mcp connect ghidra
server: ghidra
transport: stdio/json-rpc
skills gate: enabled tools only

/rehamr > audit function boundaries
plan: symbols → entrypoints → calls → jump tables
rule: no claims without evidence`
];

let terminalIndex = 0;
setInterval(() => {
  terminalIndex = (terminalIndex + 1) % states.length;
  terminal.textContent = states[terminalIndex];
}, 5200);

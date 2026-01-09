export function seat(num, onClick) {
  const d = document.createElement("div");
  d.className = "seat";
  d.textContent = num;
  d.onclick = () => onClick(num, d);
  return d;
}

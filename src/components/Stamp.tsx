export function Stamp({ label = "लिख लिया" }: { label?: string }) {
  return (
    <div className="stamp" role="img" aria-label="Likh liya" data-testid="stamp">
      <span lang="hi" aria-hidden="true">
        {label}
      </span>
    </div>
  );
}

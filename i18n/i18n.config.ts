/**
 * Plural selection.
 *
 * Bosnian, Croatian and Serbian take three forms, chosen by the last digits of
 * the number: 1 ocjena, 2-4 ocjene, 5+ ocjena — with 11-14 falling into the
 * last group despite ending in 1-4. The default rule only knows singular and
 * plural, which is how a page ends up reading "1 pjesama".
 *
 * Message strings supply four choices: zero | one | few | many.
 */
function bosnianPlural(choice: number, choicesLength: number): number {
  if (choice === 0) return 0;

  const lastTwo = choice % 100;
  const last = choice % 10;

  // The teens are the exception: 11 through 14 do not follow their last digit.
  if (lastTwo >= 11 && lastTwo <= 14) return choicesLength > 3 ? 3 : 2;
  if (last === 1) return 1;
  if (last >= 2 && last <= 4) return choicesLength > 3 ? 2 : 1;

  return choicesLength > 3 ? 3 : 2;
}

export default defineI18nConfig(() => ({
  legacy: false,
  pluralRules: {
    bs: bosnianPlural
  }
}));

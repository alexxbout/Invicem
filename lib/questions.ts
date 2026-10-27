export type Question = {
  text: string;
  theme: string;
  /** 1 = léger, 2 = personnel, 3 = profond */
  depth: 1 | 2 | 3;
  /** a golden card, dealt now and then */
  rare?: boolean;
  /** written by one of the players on a blank card */
  written?: boolean;
  /** a card both players answer at once, in secret, then reveal together */
  duo?: Duo;
};

/**
 * "scale": each puts a cursor between two words. "word": each writes a single word.
 * Both answer for themselves; the two answers turn over at the same instant.
 */
export type Duo = { kind: "scale"; low: string; high: string } | { kind: "word" };

// Placeholder deck, to be replaced by the real one.
export const QUESTIONS: Question[] = [
  { theme: "Souvenirs", depth: 1, text: "Quel est le premier souvenir qui te vient quand tu penses à l'enfance ?" },
  { theme: "Quotidien", depth: 1, text: "Quel petit rituel de ta journée ne changerais-tu pour rien au monde ?" },
  { theme: "Goûts", depth: 1, text: "Quelle chanson te met de bonne humeur à coup sûr ?" },
  { theme: "Souvenirs", depth: 2, text: "Quel moment de ta vie voudrais-tu revivre une seule fois, en entier ?" },
  { theme: "Valeurs", depth: 2, text: "Qu'est-ce qui te fait te sentir vraiment respecté(e) ?" },
  { theme: "Relation", depth: 2, text: "Quel geste de ma part te touche le plus, même discret ?" },
  { theme: "Envies", depth: 2, text: "Quelle version de toi aimerais-tu rencontrer dans dix ans ?" },
  { theme: "Valeurs", depth: 3, text: "Qu'as-tu appris de plus difficile sur toi-même ces dernières années ?" },
  { theme: "Peurs", depth: 3, text: "Quelle blessure t'a le plus façonné(e) ?" },
  // Regard: how others see you. Works on a first evening, no need to know each other yet.
  { theme: "Regard", depth: 1, text: "Quelle première impression penses-tu laisser aux gens ? Est-elle juste ?" },
  { theme: "Regard", depth: 2, text: "Si tes amis devaient te décrire avec une qualité et un défaut, que diraient-ils ?" },
  { theme: "Regard", depth: 2, text: "Comment ta famille te décrirait-elle en trois mots ? Serais-tu d'accord ?" },
  { theme: "Regard", depth: 3, text: "Qu'est-ce que l'enfant que tu étais penserait de la personne que tu es devenue ?" },
  { theme: "Regard", depth: 3, text: "Qu'est-ce qu'on te reproche parfois et qui, au fond, est vrai ?" },  // the player's own picks
  { theme: "Envies", depth: 1, text: "Si tu avais 3 mois payés sans obligation, que ferais-tu la première semaine ? Et le dernier mois ?" },
  { theme: "Goûts", depth: 1, text: "Sur quel sujet pourrais-tu parler une heure sans préparation ?" },
  { theme: "Regard", depth: 2, text: "Quel type de personne te fatigue le plus, et que dit-ça de toi ?" },
  { theme: "Peurs", depth: 2, text: "Quelle peur n'as-tu jamais vraiment dite à voix haute ?" },
  { theme: "Relation", depth: 2, text: "Quelle règle t'es-tu fixée après ta dernière relation sérieuse ?" },
  { theme: "Regard", depth: 3, text: "Dans quelle situation es-tu la pire version de toi-même ?" },
  { theme: "Relation", depth: 3, text: "Qu'attends-tu d'un(e) partenaire sans oser le demander ?" },
  { theme: "Regard", depth: 3, text: "Qu'aimerais-tu qu'on comprenne de toi sans que tu aies à l'expliquer ?" },
  // written in the same style (see docs/questions.md)
  { theme: "Quotidien", depth: 1, text: "Qu'est-ce qui te remet de bonne humeur en moins de cinq minutes ?" },
  { theme: "Quotidien", depth: 1, text: "Que fais-tu d'une soirée rien que pour toi ?" },
  { theme: "Quotidien", depth: 1, text: "Quelle petite habitude des autres t'agace plus qu'elle ne devrait ?" },
  { theme: "Goûts", depth: 1, text: "Quelle est la dernière chose qui t'a fait rire aux larmes ?" },
  { theme: "Goûts", depth: 1, text: "Quel achat récent t'a vraiment rendu(e) heureux(se) ?" },
  { theme: "Goûts", depth: 1, text: "Quel film, livre ou série t'a fait changer d'avis sur quelque chose ?" },
  { theme: "Souvenirs", depth: 1, text: "Quel endroit de ton enfance pourrais-tu décrire les yeux fermés ?" },
  { theme: "Souvenirs", depth: 1, text: "Quel est ton plus beau souvenir de vacances, et avec qui ?" },
  { theme: "Envies", depth: 1, text: "Quel métier ferais-tu si l'argent ne comptait pas, et pourquoi celui-là ?" },
  { theme: "Envies", depth: 1, text: "Quelle compétence aimerais-tu maîtriser d'ici un an ?" },
  { theme: "Regard", depth: 1, text: "Sur quoi es-tu têtu(e), même quand tu sais que tu as tort ?" },
  { theme: "Regard", depth: 1, text: "Quel compliment reçu récemment t'a fait plaisir, et pourquoi celui-là ?" },
  { theme: "Relation", depth: 1, text: "Qu'est-ce qui, chez quelqu'un, te donne tout de suite confiance ?" },
  { theme: "Valeurs", depth: 2, text: "Qu'est-ce que tes parents t'ont transmis que tu veux garder, et ce que tu veux laisser ?" },
  { theme: "Valeurs", depth: 2, text: "À quel moment t'es-tu senti(e) vraiment fier(e) de toi ?" },
  { theme: "Valeurs", depth: 2, text: "Qu'est-ce que tu as du mal à pardonner ?" },
  { theme: "Peurs", depth: 2, text: "Qu'est-ce qui te fait perdre confiance en toi le plus vite ?" },
  { theme: "Peurs", depth: 2, text: "Qu'est-ce qui te rend jaloux(se), même un peu ?" },
  { theme: "Relation", depth: 2, text: "Au début d'une relation, qu'est-ce qui te fait fuir ?" },
  { theme: "Relation", depth: 2, text: "Comment réagis-tu quand quelqu'un te déçoit ?" },
  { theme: "Relation", depth: 2, text: "Qu'est-ce qui te donne l'impression d'être vraiment écouté(e) ?" },
  { theme: "Souvenirs", depth: 2, text: "Qu'est-ce que tu regrettes de ne pas avoir dit à quelqu'un ?" },
  { theme: "Souvenirs", depth: 2, text: "Quel conseil donnerais-tu à toi d'il y a cinq ans ?" },
  { theme: "Regard", depth: 2, text: "Quelle critique t'a le plus marqué(e), et avait-elle raison ?" },
  { theme: "Regard", depth: 2, text: "Qu'est-ce que tu fais pour qu'on t'apprécie, même quand ça te coûte ?" },
  { theme: "Regard", depth: 2, text: "Dans quoi es-tu moins sûr(e) de toi que tu ne le laisses paraître ?" },
  { theme: "Valeurs", depth: 3, text: "Qu'est-ce que tu as mis le plus de temps à accepter chez toi ?" },
  { theme: "Relation", depth: 3, text: "Dans tes relations passées, quel schéma se répète et que tu aimerais casser ?" },
  { theme: "Relation", depth: 3, text: "De quoi as-tu besoin pour te sentir en sécurité avec quelqu'un ?" },
  { theme: "Relation", depth: 3, text: "Qu'est-ce que tu aurais besoin d'entendre plus souvent ?" },
  { theme: "Peurs", depth: 3, text: "Qu'est-ce qui te fait peur dans le fait de t'attacher à quelqu'un ?" },
  { theme: "Peurs", depth: 3, text: "Qu'est-ce que tu caches au début, de peur que les gens s'éloignent ?" },
  { theme: "Regard", depth: 3, text: "Quand t'es-tu senti(e) le plus incompris(e) ?" },
  { theme: "Souvenirs", depth: 3, text: "Quel moment t'a fait grandir d'un coup ?" },
  { theme: "Envies", depth: 3, text: "Qu'est-ce qui, dans ta vie actuelle, ne te ressemble plus ?" },
  // the player's second batch, rewritten to stay personal and concrete
  { theme: "Envies", depth: 1, text: "Quel super pouvoir aimerais-tu avoir, et que ferais-tu en premier avec ?" },
  { theme: "Valeurs", depth: 1, text: "Quelle qualité admires-tu le plus chez l'un de tes parents ?" },
  { theme: "Valeurs", depth: 1, text: "Y a-t-il une phrase ou un conseil qui te guide encore aujourd'hui ? D'où vient-il ?" },
  { theme: "Goûts", depth: 1, text: "Qu'est-ce que tu trouves beau, que les autres ne remarquent pas forcément ?" },
  { theme: "Relation", depth: 2, text: "Dans une relation, qu'est-ce qui te fait te sentir vraiment aimé(e) ?" },
  { theme: "Peurs", depth: 2, text: "Quels types de conversations te mettent mal à l'aise, et pourquoi ?" },
  { theme: "Regard", depth: 2, text: "Qu'est-ce que tu aimes le plus chez toi, et qu'est-ce que tu aimes le moins ?" },
  { theme: "Envies", depth: 2, text: "Si ta vie était un livre, quel titre aurait le chapitre en cours ?" },
  { theme: "Souvenirs", depth: 2, text: "Qu'est-ce qui t'a le plus fait grandir ces dernières années ?" },
  { theme: "Valeurs", depth: 2, text: "Y a-t-il une cause pour laquelle tu aimerais vraiment t'engager ?" },
  { theme: "Valeurs", depth: 2, text: "Pour quoi es-tu reconnaissant(e) en ce moment, sans assez le dire ?" },
  { theme: "Valeurs", depth: 2, text: "Dans quelle situation trouves-tu normal de mentir ?" },
  { theme: "Envies", depth: 2, text: "Qu'est-ce qui te ferait dire, dans dix ans, que tu as réussi ta vie ?" },
  // more in the same vein
  { theme: "Quotidien", depth: 1, text: "Quel moment de ta journée attends-tu le plus, et pourquoi ?" },
  { theme: "Goûts", depth: 1, text: "Quel lieu te fait du bien à chaque fois que tu y vas ?" },
  { theme: "Souvenirs", depth: 1, text: "Quelle bêtise d'enfant te fait encore rire aujourd'hui ?" },
  { theme: "Regard", depth: 2, text: "Sur quoi les gens se trompent-ils souvent à ton sujet ?" },
  { theme: "Relation", depth: 2, text: "Comment montres-tu à quelqu'un qu'il compte pour toi ?" },
  { theme: "Valeurs", depth: 2, text: "Sur quoi as-tu complètement changé d'avis en grandissant ?" },
  { theme: "Peurs", depth: 3, text: "Qu'est-ce que tu aurais peur de découvrir sur toi ?" },
  { theme: "Valeurs", depth: 3, text: "Quelle décision regrettes-tu le plus ?" },  // the big batch, written to docs/questions.md
  { theme: "Souvenirs", depth: 1, text: "Quel jouet ou objet de ton enfance aimerais-tu retrouver ?" },
  { theme: "Souvenirs", depth: 1, text: "Quel prof t'a marqué(e), en bien ou en mal ?" },
  { theme: "Souvenirs", depth: 1, text: "Quelle odeur te ramène directement en enfance ?" },
  { theme: "Souvenirs", depth: 2, text: "Quel souvenir d'adolescence te fait encore un peu honte ?" },
  { theme: "Souvenirs", depth: 2, text: "Quelle personne a compté pour toi, et que tu as perdue de vue ?" },
  { theme: "Souvenirs", depth: 2, text: "Quelle période de ta vie as-tu préférée jusqu'ici ?" },
  { theme: "Souvenirs", depth: 3, text: "Quel moment difficile t'a rendu(e) plus fort(e) ?" },
  { theme: "Souvenirs", depth: 3, text: "Qu'est-ce qui t'a manqué quand tu étais enfant ?" },
  { theme: "Quotidien", depth: 1, text: "Quelle est la première chose que tu fais le matin ?" },
  { theme: "Quotidien", depth: 1, text: "Quel petit plaisir t'offres-tu quand la journée a été dure ?" },
  { theme: "Quotidien", depth: 1, text: "Qu'est-ce qui traîne toujours dans ton sac ou tes poches ?" },
  { theme: "Quotidien", depth: 1, text: "Qu'est-ce que tu remets toujours au lendemain ?" },
  { theme: "Quotidien", depth: 2, text: "Qu'est-ce qui te stresse le plus au quotidien ?" },
  { theme: "Quotidien", depth: 2, text: "Dans ta semaine, quel moment te ressemble le plus ?" },
  { theme: "Quotidien", depth: 2, text: "À quoi penses-tu juste avant de t'endormir ?" },
  { theme: "Quotidien", depth: 3, text: "Qu'est-ce que tu fais pour fuir quand ça ne va pas ?" },
  { theme: "Quotidien", depth: 3, text: "Qu'est-ce qui te pèse en ce moment, sans que tu en parles ?" },
  { theme: "Goûts", depth: 1, text: "Quel plat pourrais-tu manger toute ta vie sans te lasser ?" },
  { theme: "Goûts", depth: 1, text: "Quelle musique écoutes-tu quand tu es seul(e) ?" },
  { theme: "Goûts", depth: 1, text: "Quelle est la dernière chose qui t'a émerveillé(e) ?" },
  { theme: "Goûts", depth: 1, text: "Quel genre de cadeau te touche le plus ?" },
  { theme: "Goûts", depth: 2, text: "Quel livre, film ou chanson te ressemble le plus ?" },
  { theme: "Goûts", depth: 2, text: "Quel goût assumes-tu mal devant les autres ?" },
  { theme: "Goûts", depth: 2, text: "Quelle chanson te fait monter les larmes ?" },
  { theme: "Goûts", depth: 3, text: "Quelle œuvre t'a aidé(e) à traverser un moment difficile ?" },
  { theme: "Envies", depth: 1, text: "Quel pays rêves-tu de découvrir, et qu'y ferais-tu en premier ?" },
  { theme: "Envies", depth: 1, text: "Qu'est-ce que tu aimerais apprendre si tu avais le temps ?" },
  { theme: "Envies", depth: 1, text: "Quelle expérience aimerais-tu vivre au moins une fois ?" },
  { theme: "Envies", depth: 2, text: "Qu'est-ce que tu repousses depuis trop longtemps ?" },
  { theme: "Envies", depth: 2, text: "À quoi ressemblerait ta journée parfaite, dans cinq ans ?" },
  { theme: "Envies", depth: 2, text: "Qu'est-ce qui te manque aujourd'hui pour être vraiment heureux(se) ?" },
  { theme: "Envies", depth: 3, text: "Qu'est-ce que tu n'oses pas encore tenter, et qu'est-ce qui te retient ?" },
  { theme: "Envies", depth: 3, text: "Si tu devais tout recommencer à zéro, que garderais-tu ?" },
  { theme: "Valeurs", depth: 1, text: "Quelle qualité remarques-tu en premier chez les autres ?" },
  { theme: "Valeurs", depth: 1, text: "Quel petit geste d'un inconnu t'a déjà touché(e) ?" },
  { theme: "Valeurs", depth: 2, text: "Qu'est-ce que tu ne supportes pas qu'on fasse aux autres ?" },
  { theme: "Valeurs", depth: 2, text: "Pour quoi serais-tu prêt(e) à te fâcher avec un ami ?" },
  { theme: "Valeurs", depth: 2, text: "Qu'est-ce que l'argent représente pour toi ?" },
  { theme: "Valeurs", depth: 2, text: "Quelle règle de ton éducation as-tu laissée tomber ?" },
  { theme: "Valeurs", depth: 3, text: "Qu'est-ce que tu ne ferais jamais, même pour beaucoup d'argent ?" },
  { theme: "Valeurs", depth: 3, text: "Avec qui as-tu peur d'avoir été injuste ?" },
  { theme: "Peurs", depth: 1, text: "De quoi avais-tu peur enfant, et en as-tu encore peur ?" },
  { theme: "Peurs", depth: 1, text: "Quelle petite peur un peu bête as-tu encore ?" },
  { theme: "Peurs", depth: 2, text: "Qu'est-ce qui t'inquiète quand tu penses à l'avenir ?" },
  { theme: "Peurs", depth: 2, text: "Qu'as-tu peur que les autres pensent de toi ?" },
  { theme: "Peurs", depth: 2, text: "Quelle situation t'intimide encore aujourd'hui ?" },
  { theme: "Peurs", depth: 3, text: "Qu'est-ce qui te fait peur dans le fait de vieillir ?" },
  { theme: "Peurs", depth: 3, text: "Quelle peur t'a déjà fait passer à côté de quelque chose ?" },
  { theme: "Peurs", depth: 3, text: "Qu'est-ce que tu crains de reproduire de tes parents ?" },
  { theme: "Relation", depth: 1, text: "Qu'est-ce qui te fait craquer chez quelqu'un dès la première rencontre ?" },
  { theme: "Relation", depth: 1, text: "Quel est le plus beau geste qu'on ait eu pour toi ?" },
  { theme: "Relation", depth: 2, text: "Comment sais-tu que tu peux faire confiance à quelqu'un ?" },
  { theme: "Relation", depth: 2, text: "Qu'est-ce que tu as besoin de garder pour toi, même en couple ?" },
  { theme: "Relation", depth: 2, text: "Qu'est-ce qu'une amitié doit avoir pour durer, à tes yeux ?" },
  { theme: "Relation", depth: 2, text: "Comment réagis-tu quand on te fait un compliment ?" },
  { theme: "Relation", depth: 3, text: "Qu'est-ce qui te fait te sentir seul(e), même entouré(e) ?" },
  { theme: "Relation", depth: 3, text: "Qu'est-ce que tu as du mal à recevoir des autres ?" },
  { theme: "Relation", depth: 3, text: "Qu'est-ce qui te fait douter qu'on puisse t'aimer ?" },
  { theme: "Regard", depth: 1, text: "Qu'est-ce que tu fais mieux que la plupart des gens ?" },
  { theme: "Regard", depth: 1, text: "Quel surnom t'a-t-on donné, et qu'en penses-tu ?" },
  { theme: "Regard", depth: 2, text: "Qu'est-ce que tu aimerais que les gens remarquent chez toi ?" },
  { theme: "Regard", depth: 2, text: "Dans quelle situation te sens-tu le plus toi-même ?" },
  { theme: "Regard", depth: 2, text: "Qu'as-tu de tes parents que tu aimerais ne pas avoir ?" },
  { theme: "Regard", depth: 3, text: "Qu'est-ce que tu n'as jamais réussi à te pardonner ?" },
  { theme: "Regard", depth: 3, text: "Quelle image de toi essaies-tu de donner, et qu'est-ce qu'elle cache ?" },
  { theme: "Regard", depth: 3, text: "Quand as-tu eu honte de toi pour la dernière fois ?" },
];

/**
 * Rare cards: bolder or more playful, dealt about once every eight hands, never filtered by
 * theme. They carry their own small labels.
 */
export const RARE_QUESTIONS: Question[] = [
  { theme: "Audace", depth: 2, text: "Quelle est la chose la plus folle que tu aimerais vivre avec moi ?" },
  { theme: "Audace", depth: 1, text: "Fais-moi un compliment que personne ne t'a jamais entendu faire." },
  { theme: "Confidence", depth: 3, text: "Quand t'es-tu senti(e) le plus seul(e) au monde ?" },
  { theme: "Confidence", depth: 2, text: "Quel secret d'enfance n'as-tu jamais raconté ?" },
  { theme: "Vertige", depth: 3, text: "Si tu savais que tout s'arrête dans un an, que changerais-tu dès demain ?" },
  { theme: "Vertige", depth: 2, text: "Quelle question aimerais-tu qu'on te pose plus souvent ?" },
  { theme: "Vertige", depth: 3, text: "À quel moment as-tu senti que ta vie prenait un tournant ?" },
  { theme: "Jeu", depth: 1, text: "Décris-moi en trois mots. Puis je fais pareil pour toi." },
  { theme: "Jeu", depth: 1, text: "Si on partait demain, sans bagage, où irait-on ?" },
  { theme: "Regard", depth: 2, text: "Qu'est-ce que tu as remarqué chez moi ce soir et que tu n'avais jamais vu ?" },
  { theme: "Regard", depth: 3, text: "Qu'est-ce que tu admires chez moi, sans jamais me l'avoir dit ?" },
  { theme: "Regard", depth: 2, text: "À ton avis, qu'est-ce que je cache le mieux ?" },
];

const scale = (low: string, high: string): Duo => ({ kind: "scale", low, high });
const word: Duo = { kind: "word" };

/**
 * Duo cards, slipped into a hand now and then. Both players answer on their own phone,
 * in secret, then the two answers are revealed side by side and talked about.
 */
export const DUO_QUESTIONS: Question[] = [
  { theme: "Quotidien", depth: 1, text: "Plutôt du matin ou du soir ?", duo: scale("Du matin", "Du soir") },
  { theme: "Regard", depth: 1, text: "Dans un groupe, plutôt discret ou au centre ?", duo: scale("Discret", "Au centre") },
  { theme: "Peurs", depth: 2, text: "À quel point as-tu peur de décevoir les autres ?", duo: scale("Peu", "Beaucoup") },
  { theme: "Relation", depth: 2, text: "Pour te sentir aimé(e), plutôt les mots ou les gestes ?", duo: scale("Les mots", "Les gestes") },
  { theme: "Souvenirs", depth: 2, text: "Ton enfance, plutôt légère ou lourde à porter ?", duo: scale("Légère", "Lourde") },
  { theme: "Valeurs", depth: 3, text: "À quel point te sens-tu libre d'être toi-même ?", duo: scale("Sur la réserve", "Libre") },
  { theme: "Relation", depth: 3, text: "À quel point est-ce facile pour toi de demander de l'aide ?", duo: scale("Difficile", "Facile") },
  { theme: "Quotidien", depth: 1, text: "À quel point as-tu besoin de temps seul(e) ?", duo: scale("Peu", "Beaucoup") },
  { theme: "Regard", depth: 1, text: "À quel point te fies-tu à ta première impression ?", duo: scale("Peu", "Beaucoup") },
  { theme: "Regard", depth: 2, text: "À quel point montres-tu ce que tu ressens ?", duo: scale("Peu", "Beaucoup") },
  { theme: "Relation", depth: 2, text: "Quand ça ne va pas, tu t'isoles ou tu en parles ?", duo: scale("Je m'isole", "J'en parle") },
  { theme: "Relation", depth: 2, text: "Dans un conflit, tu évites ou tu affrontes ?", duo: scale("J'évite", "J'affronte") },
  { theme: "Souvenirs", depth: 2, text: "Le passé, tu y repenses souvent ?", duo: scale("Rarement", "Souvent") },
  { theme: "Valeurs", depth: 3, text: "Avec toi-même, tu es plutôt tendre ou sévère ?", duo: scale("Tendre", "Sévère") },
  { theme: "Valeurs", depth: 2, text: "Est-ce que tu pardonnes facilement ?", duo: scale("Difficilement", "Facilement") },
  { theme: "Quotidien", depth: 1, text: "Ton téléphone, il est toujours avec toi ?", duo: scale("Rarement", "Toujours") },
  { theme: "Goûts", depth: 1, text: "En soirée, tu préfères peu de monde ou beaucoup ?", duo: scale("Peu de monde", "Beaucoup de monde") },
  { theme: "Envies", depth: 1, text: "Les imprévus, c'est angoissant ou excitant ?", duo: scale("Angoissant", "Excitant") },
  { theme: "Valeurs", depth: 1, text: "Tu fais confiance facilement ?", duo: scale("Difficilement", "Facilement") },
  { theme: "Regard", depth: 2, text: "À quel point fais-tu attention à ce que les autres pensent ?", duo: scale("Peu", "Beaucoup") },
  { theme: "Relation", depth: 2, text: "Tu tombes amoureux(se) lentement ou vite ?", duo: scale("Lentement", "Vite") },
  { theme: "Peurs", depth: 2, text: "À quel point as-tu peur de l'échec ?", duo: scale("Peu", "Beaucoup") },
  { theme: "Valeurs", depth: 2, text: "Tu dis ce que tu penses, ou tu arrondis les angles ?", duo: scale("J'arrondis", "Je dis tout") },
  { theme: "Souvenirs", depth: 2, text: "Ton adolescence, tu en gardes un bon souvenir ?", duo: scale("Mauvais", "Bon") },
  { theme: "Envies", depth: 2, text: "À quel point te sens-tu à ta place aujourd'hui ?", duo: scale("Peu", "Beaucoup") },
  { theme: "Quotidien", depth: 2, text: "Le soir, tu arrives à décrocher ?", duo: scale("Difficilement", "Facilement") },
  { theme: "Peurs", depth: 3, text: "À quel point as-tu peur d'être abandonné(e) ?", duo: scale("Peu", "Beaucoup") },
  { theme: "Relation", depth: 3, text: "Dire « je t'aime », c'est facile pour toi ?", duo: scale("Difficile", "Facile") },
  { theme: "Regard", depth: 3, text: "À quel point t'aimes-tu, aujourd'hui ?", duo: scale("Peu", "Beaucoup") },
  { theme: "Souvenirs", depth: 1, text: "Un mot pour ton enfance.", duo: word },
  { theme: "Goûts", depth: 1, text: "Un mot pour ton dimanche idéal.", duo: word },
  { theme: "Quotidien", depth: 1, text: "Un mot pour ta semaine.", duo: word },
  { theme: "Envies", depth: 1, text: "Un mot pour l'endroit où tu aimerais être, là, maintenant.", duo: word },
  { theme: "Regard", depth: 2, text: "Un mot que tes proches utilisent pour te décrire.", duo: word },
  { theme: "Valeurs", depth: 2, text: "Un mot pour ce qui compte le plus pour toi.", duo: word },
  { theme: "Peurs", depth: 2, text: "Un mot pour ce qui t'empêche parfois de dormir.", duo: word },
  { theme: "Relation", depth: 2, text: "Un mot pour ce que tu attends de quelqu'un qui t'aime.", duo: word },
  { theme: "Envies", depth: 3, text: "Un mot pour la personne que tu voudrais devenir.", duo: word },
  { theme: "Souvenirs", depth: 3, text: "Un mot pour le moment qui t'a le plus changé(e).", duo: word },
  { theme: "Quotidien", depth: 1, text: "Un mot pour ce que tu ressens, là, maintenant.", duo: word },
  { theme: "Souvenirs", depth: 2, text: "Un mot pour ta famille.", duo: word },
  { theme: "Regard", depth: 2, text: "Un mot que tu aimerais qu'on utilise pour te décrire.", duo: word },
  { theme: "Regard", depth: 1, text: "Un mot pour ta plus belle qualité.", duo: word },
  { theme: "Goûts", depth: 1, text: "Un mot pour ton lieu préféré.", duo: word },
  { theme: "Souvenirs", depth: 1, text: "Un mot pour tes 15 ans.", duo: word },
  { theme: "Souvenirs", depth: 1, text: "Un mot pour la maison où tu as grandi.", duo: word },
  { theme: "Envies", depth: 2, text: "Un mot pour l'année qui vient.", duo: word },
  { theme: "Relation", depth: 2, text: "Un mot pour ce que tu apportes dans une relation.", duo: word },
  { theme: "Peurs", depth: 2, text: "Un mot pour ta plus grande peur.", duo: word },
  { theme: "Valeurs", depth: 2, text: "Un mot pour ce sur quoi tu ne transiges jamais.", duo: word },
  { theme: "Regard", depth: 3, text: "Un mot pour ce que tu caches le mieux.", duo: word },
  { theme: "Peurs", depth: 3, text: "Un mot pour ce qui te fait le plus peur en amour.", duo: word },
];

/** The shared last card of an evening; both answer it. */
export const CLOSING: Question = {
  theme: "Pour finir",
  depth: 3,
  text: "Qu'as-tu découvert de l'autre ce soir ?",
};

export type Depth = Question["depth"];

/** What the pair wants to talk about tonight. Empty `themes` means every theme. */
export type Criteria = { depths: Depth[]; themes: string[] };

export const DEFAULT_CRITERIA: Criteria = { depths: [1, 2, 3], themes: [] };

export const THEMES = [...new Set(QUESTIONS.map((q) => q.theme))];

export const matches = (q: Question, c: Criteria) =>
  c.depths.includes(q.depth) && (c.themes.length === 0 || c.themes.includes(q.theme));

/** Parse untrusted input; returns null when unusable. */
export function parseCriteria(raw: unknown): Criteria | null {
  const r = raw as { depths?: unknown; themes?: unknown } | null;
  if (!Array.isArray(r?.depths) || !Array.isArray(r?.themes)) return null;
  const depths = ([1, 2, 3] as Depth[]).filter((d) => (r.depths as unknown[]).includes(d));
  const themes = THEMES.filter((t) => (r.themes as unknown[]).includes(t));
  return depths.length ? { depths, themes } : null;
}

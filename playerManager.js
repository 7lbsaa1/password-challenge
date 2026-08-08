export const PlayerManager = {
  players: [
    "Lionel Messi", "Cristiano Ronaldo", "Kylian Mbappé", "Vinícius Júnior",
    "Jude Bellingham", "Robert Lewandowski", "Luka Modrić", "Antoine Griezmann",
    "Lamine Yamal", "Pedri", "Rodrygo", "Federico Valverde", "Eduardo Camavinga",
    "Aurélien Tchouaméni", "Endrick", "Arda Güler", "Dani Carvajal",
    "Ferland Mendy", "Antonio Rüdiger", "Thibaut Courtois", "Ronald Araújo",
    "Jules Koundé", "Andreas Christensen", "Frenkie de Jong", "Raphinha",
    "Ferran Torres", "Dani Olmo", "Marc-André ter Stegen", "Jan Oblak",
    "Rodrigo De Paul", "José María Giménez", "Alexander Sørloth", "Mikel Oyarzabal",
    "Takefusa Kubo", "Martín Zubimendi", "Iñaki Williams", "Nico Williams",
    "Unai Simón", "Isco", "Sergio Ramos",

    "Erling Haaland", "Kevin De Bruyne", "Mohamed Salah", "Rodri",
    "Bukayo Saka", "Phil Foden", "Virgil van Dijk", "Trent Alexander-Arnold",
    "Bruno Fernandes", "Martin Ødegaard", "William Saliba", "Kyle Walker",
    "Declan Rice", "Marcus Rashford", "Jack Grealish", "Gabriel Martinelli",
    "Kai Havertz", "John Stones", "Manuel Akanji", "Joško Gvardiol",
    "Mateo Kovačić", "Jérémy Doku", "Gabriel Magalhães", "Ben White",
    "Leandro Trossard", "Alexis Mac Allister", "Dominik Szoboszlai", "Luis Díaz",
    "Diogo Jota", "Cody Gakpo", "Darwin Núñez", "Andrew Robertson",
    "Ibrahima Konaté", "Lisandro Martínez", "Diogo Dalot", "Casemiro",
    "Kobbie Mainoo", "Alejandro Garnacho", "Rasmus Højlund", "James Maddison",
    "Dejan Kulusevski", "Cristian Romero", "Micky van de Ven", "Guglielmo Vicario",
    "Ollie Watkins", "Emiliano Martínez", "Youri Tielemans", "John McGinn",
    "Cole Palmer", "Enzo Fernández", "Moises Caicedo", "Christopher Nkunku",
    "Nicolas Jackson", "Reece James", "Alexander Isak", "Anthony Gordon",
    "Bruno Guimarães", "Kieran Trippier", "Jarrod Bowen", "Mohammed Kudus",
    "Lucas Paquetá", "Kaoru Mitoma", "Bryan Mbeumo", "Matheus Cunha",
    "Dominic Solanke", "Eberechi Eze", "Marc Guéhi",

    "Harry Kane", "Jamal Musiala", "Florian Wirtz", "Joshua Kimmich",
    "Leon Goretzka", "Dayot Upamecano", "Manuel Neuer", "Thomas Müller",
    "Leroy Sané", "Serge Gnabry", "Kingsley Coman", "Alphonso Davies",
    "Granit Xhaka", "Jeremie Frimpong", "Alejandro Grimaldo", "Victor Boniface",
    "Jonathan Tah", "Xavi Simons", "Loïs Openda", "Benjamin Šeško",
    "Serhou Guirassy", "Julian Brandt", "Marcel Sabitzer", "Nico Schlotterbeck",
    "Gregor Kobel", "Omar Marmoush",

    "Lautaro Martínez", "Paulo Dybala", "Rafael Leão", "Khvicha Kvaratskhelia",
    "Victor Osimhen", "Romelu Lukaku", "Dušan Vlahović", "Federico Chiesa",
    "Nicolò Barella", "Alessandro Bastoni", "Hakan Çalhanoğlu", "Marcus Thuram",
    "Benjamin Pavard", "Yann Sommer", "Mike Maignan", "Fikayo Tomori",
    "Tijjani Reijnders", "Gleison Bremer", "Teun Koopmeiners", "Kenan Yıldız",
    "Ademola Lookman", "Charles De Ketelaere", "Gianluca Scamacca", "Artem Dovbyk",
    "Lorenzo Pellegrini", "Theo Hernández", "Zlatan Ibrahimović",

    "Ousmane Dembélé", "Achraf Hakimi", "Marquinhos", "Vitinha",
    "Warren Zaïre-Emery", "Fabián Ruiz", "Gianluigi Donnarumma", "Nuno Mendes",
    "Jonathan David", "Viktor Gyökeres", "Ángel Di María", "Nicolás Otamendi",
    "Luis Suárez", "Neymar", "Karim Benzema", "Sadio Mané",
    "Riyad Mahrez", "N'Golo Kanté", "Hakim Ziyech", "Yassine Bounou",
    "Sofyan Amrabat", "Kalidou Koulibaly", "Édouard Mendy", "Roberto Firmino",
    "Jordan Henderson", "Franck Kessié", "Aleksandar Mitrović", "Ivan Toney",
    "Son Heung-min"
  ],

  usedPlayers: [],

  _getRandomName() {
    if (this.usedPlayers.length >= this.players.length) {
      this.usedPlayers = [];
    }
    const availablePlayers = this.players.filter(p => !this.usedPlayers.includes(p));
    const randomIndex = Math.floor(Math.random() * availablePlayers.length);
    const selectedPlayer = availablePlayers[randomIndex];
    this.usedPlayers.push(selectedPlayer);
    return selectedPlayer;
  },

  async getRoundPlayer() {
    const playerName = this._getRandomName();
    const formattedName = encodeURIComponent(playerName.replaceAll(" ", "_"));
    const apiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${formattedName}`;

    try {
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error("API Error");
      const data = await response.json();

      return {
        name: data.title || playerName,
        image: data.originalimage
          ? data.originalimage.source
          : data.thumbnail
            ? data.thumbnail.source
            : `https://ui-avatars.com/api/?name=${encodeURIComponent(playerName)}&size=300&background=random`,
        description: data.description || "Footballer"
      };
    } catch (error) {
      console.warn(`فشل جلب صورة ${playerName}، استخدام بيانات احتياطية.`, error);
      return {
        name: playerName,
        image: `https://ui-avatars.com/api/?name=${encodeURIComponent(playerName)}&size=300&background=random`,
        description: "Footballer"
      };
    }
  }
};

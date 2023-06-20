import blessed from "blessed";
import { Subject, take } from "rxjs";

const screen = blessed.screen({
  smartCSR: true
});

screen.title = "Sync-Maestro";

const asciiArt = "⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢰⣄⢸⡆⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢰⠂⢖⢘⢉⠒⡐⠁⢎⡐⠐⢄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀\n" +
  "⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⢳⣽⢀⠀⡠⡀⠀⠀⠀⠀⠀⠀⠠⢎⢆⢡⡜⡡⣎⡉⢎⣊⠄⠸⡦⣄⡈⡐⠠⠀⠀⠀⠀⠀⠀⠀⠀\n" +
  "⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠠⣐⣔⣔⣤⣦⢹⣇⢠⣻⠁⠀⠀⠀⠀⠀⠀⢸⡣⡲⡱⡝⣼⢡⢟⣵⣫⣓⢆⠹⡦⡈⠘⢂⢈⠃⠀⠀⠀⠀⠀⠀\n" +
  "⠳⢄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢿⣹⡀⠁⢻⢗⡵⢢⡿⠀⠀⠀⠀⠀⠀⠀⢀⢏⢝⢙⣪⣊⣓⢯⢳⡿⣮⡿⣶⣮⡑⡡⠀⡌⠐⡄⠀⠀⠀⠀⠀\n" +
  "⠀⠈⠓⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⣿⣣⠀⣘⡕⠄⣿⡇⠀⠀⠀⠀⠀⠀⠀⠚⡵⡷⢡⠽⣿⣝⣿⣳⡽⣛⢿⣳⣷⡹⡜⢤⣈⢃⠂⠀⠀⠀⠀⠀\n" +
  "⠀⠀⠀⠀⠑⢄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢻⡘⢐⠅⢍⡺⣟⠄⠀⠀⠀⠀⠀⠀⠀⠀⢻⣡⡝⢮⠂⢆⢄⢦⠪⡕⡯⡳⣝⢎⡎⠂⢿⡨⠂⠀⠀⠀⠀⠀\n" +
  "⠀⠀⠀⠀⠀⠀⠑⢄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⣔⠕⡨⣢⢿⡕⠅⠀⠀⠀⠀⠀⠀⠀⠀⣏⢯⡿⢏⠳⣜⣯⣻⣳⡺⡘⡝⠸⣟⢾⡄⠱⡱⠁⠀⠀⠀⠀⠀\n" +
  "⠀⠀⠀⠀⠀⠀⠀⠀⠙⢄⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢻⡔⢵⣝⠿⠈⠠⠀⠀⠀⠀⠀⠀⠀⠀⡷⣽⠾⣮⡷⣹⢞⣵⢯⣟⣼⡪⣐⡛⣃⡕⠠⠨⠀⠀⠀⠀⠀⠀\n" +
  "⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠑⢤⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢽⢣⡕⡵⣀⠀⣦⡀⠀⠀⠀⠀⠀⠀⢻⡺⡗⢷⢞⢷⡻⣮⡿⣯⣿⢧⣿⠊⡉⢎⢀⠇⠀⠀⠀⠀⠀⠀\n" +
  "⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠑⢆⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠠⡁⠳⣵⣝⢮⣳⣾⣟⣞⢦⡀⠀⠀⠀⠀⠈⣷⣪⢷⡽⣯⣿⣾⢿⣟⣿⡝⡧⢢⠢⠐⡌⠀⠀⠀⠀⠀⠀⠀\n" +
  "⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠑⠦⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠨⡲⣻⣳⣿⣿⣾⡿⣷⣽⣣⣄⠀⠀⠀⠈⢳⡟⣾⣻⡷⣿⢿⣿⣻⣮⡻⠎⠓⢘⢀⠀⠀⠀⠀⠀⠀⠀\n" +
  "⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⠤⣷⣔⡠⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⢾⣿⣿⣻⣿⣿⣿⣿⣕⢿⣦⣄⠀⠀⠀⠹⣳⣽⣟⡿⣻⢝⡵⣃⣴⢖⡿⣩⣫⣣⠀⠀⠀⠀⠀⠀\n" +
  "⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣻⣥⠹⣮⠂⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⢹⣿⣿⣯⣿⣿⣿⣿⣞⣿⣞⣧⠀⠀⢀⢏⡘⢏⠮⣳⢝⡾⣯⣯⢯⣾⣵⡳⣗⣟⣶⣄⠀⠀⠀\n" +
  "⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⢎⣴⣯⣅⢻⣇⠂⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⢿⣿⣿⣿⣿⢿⣿⣾⣷⣿⡯⣆⠔⣕⣙⢎⢎⣷⡿⣿⣺⣻⣳⣷⣟⡿⣿⣮⢷⣿⣧⠀⠀\n" +
  "⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⠲⣿⡖⣿⡨⠥⡈⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠹⣿⣿⣿⣿⣿⣿⣿⣿⣿⡺⣻⠴⡧⣫⡿⣯⣟⢿⣷⣻⣟⣿⣮⢿⣯⡻⣷⣯⣻⢧⠀\n" +
  "⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⢿⣾⢑⡿⣖⢌⠢⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⢯⣳⣯⣺⡪⣯⢻⣿⡼⣯⡿⣿⣻⣿⣟⣿⣿⡳⡄\n" +
  "⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣸⢻⢮⣻⣽⡢⡣⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢹⣿⣿⣿⣿⣻⣿⣿⣾⣿⣽⣿⣮⢷⣯⢺⡵⣿⡯⣿⣷⢿⣷⣻⣿⢯⣿⡝⣦\n" +
  "⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠸⣝⢷⢽⡮⡃⠐⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣹⣿⣿⣿⣿⣿⣿⣿⣿⣷⣿⣿⣯⣿⣿⣝⣿⣝⡿⣿⣯⢿⣿⣟⣿⣟⣮⢷\n" +
  "⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢴⢋⡏⣎⢺⡢⡀⣼⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⣾⣿⡽⣽⠻⣿⣿⣿⣿⣿⣿⣿⢿⣯⣿⣞⡾⣷⣝⣿⣻⣞⣿⣿⣿⡿⣝⡯⣷\n" +
  "⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠠⡃⡑⢵⡱⣝⢮⣾⣿⣿⣽⢦⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⣿⣿⢯⡾⠃⢠⣿⣿⣷⣿⣿⣷⣿⣿⣿⣿⣾⣿⣿⣾⣿⣿⣿⣿⣿⣿⣿⣿⣟⡗\n" +
  "⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠸⡸⣣⣿⣿⣿⣿⣿⣿⣯⡻⣦⡀⠀⠀⠀⠀⠀⠀⠀⠀⢠⣿⣿⣳⡿⠁⣰⣿⣿⣿⣽⣟⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣾⣾⣮⣾⠃\n" +
  "⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠁⠻⣿⣿⣿⣿⣿⣿⣿⣿⡾⣻⢦⡀⠀⠀⠀⠀⣀⣾⣿⡿⣵⡿⠁⣼⣿⣿⣿⣿⣽⣿⣻⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣯⣯⣻⣽⡝⠀\n" +
  "⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠻⣿⣿⣿⣿⣿⣟⣿⣿⣝⣯⢖⣤⣿⣿⣿⣿⢿⣽⡟⠃⣼⣿⣿⣿⣿⣯⣿⣻⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣵⠃⠀\n" +
  "⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⠻⣿⣿⣿⣿⣿⣿⣿⣾⣟⣿⣿⣿⣿⣻⡿⡿⠀⣼⣿⣿⣿⣿⣿⣽⣿⣻⣯⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣟⣿⣿⡻⣿⡇⠀⠀\n" +
  "⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⠻⢿⣿⣿⣿⣯⣿⣿⣻⣿⣯⣿⡿⠁⢰⣿⣿⣿⣿⣿⣯⣿⣻⣿⣿⣿⣿⡿⣿⣿⣿⣻⣿⣿⣿⣿⣿⣮⣿⣟⣽⠀⠀⠀\n" +
  "⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠹⣿⣿⣿⣿⣿⣿⣿⣻⡏⠀⠀⣿⣿⣿⡿⣷⣿⣾⢿⣿⢿⣾⣿⣽⣿⣿⣿⡿⣿⣿⢿⣿⣿⣿⣿⣿⣮⠃⠀⠀⠀\n" +
  "⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⣿⣿⣿⣿⣿⠏⢀⠈⠀⣿⣿⣽⣿⣻⣷⣿⣿⣿⣿⣿⣯⣿⣾⣿⣿⣿⡷⡽⣿⣻⣿⣿⢿⣿⡗⠀⠀⠀⠀\n" +
  "⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⣿⣿⣿⣿⠃⠄⡀⠂⠀⣿⡿⣷⣿⣿⣽⣿⣷⣿⣿⣾⢿⣾⣷⣿⣿⣿⣿⣯⡺⣿⣽⣿⣿⠟⠀⠀⠀⠀⠀";

const logoArt = " ,-.                  .   ,             .          \n" +
  "(   `                 |\\ /|             |          \n" +
  " `-.  . . ;-. ,-. --- | V | ,-: ,-. ,-. |-  ;-. ,-.\n" +
  ".   ) | | | | |       |   | | | |-' `-. |   |   | |\n" +
  " `-'  `-| ' ' `-'     '   ' `-` `-' `-' `-' '   `-'\n" +
  "      `-'                                          \n";

const background = blessed.box({
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  style: {
    bg: "#0000ff"
  }
});

const art = blessed.box({
  bottom: 0,
  right: 0,
  width: "shrink",
  height: "shrink",
  content: asciiArt,
  style: {
    fg: "white",
    bg: "blue"
  }
});

const logo = blessed.box({
  left: "center",
  top: 1,
  width: "shrink",
  height: "shrink",
  content: logoArt,
  style: {
    fg: "white",
    bg: "blue"
  }
});

const consoleWindow = blessed.box({
  top: 9,
  left: 3,
  width: "60%-2",
  height: "100%-13",
  content: "Hello, world!",
  style: {
    fg: "white",
    bg: "black"
  },
  padding: 1,
  keys: true,
  mouse: true,
  scrollable: true,
  focusable: true,
  scrollbar: {
    style: {
      bg: "white"
    }
  }
});

const list = blessed.list({
  top: 9,
  left: 3,
  width: "60%-2",
  height: "100%-13",
  keys: true,
  mouse: true,
  content: "{center}Console{/center}",
  style: {
    selected: {
      bg: "green",
      fg: "black"
    }
  }
});

list.hide();

const label = blessed.box({
  parent: screen,
  top: 8,
  left: 2,
  width: "60%",
  height: "100%-11",
  content: "",
  tags: true,
  style: {
    fg: "black",
    bg: "#939393"
  },
  shadow: true,
  focusable: false
});

const optionSelected = new Subject<string>();

list.on("select", (item, index) => {
  optionSelected.next(item.getText());
});

screen.append(background);
screen.append(art);
screen.append(logo);
screen.append(label);
screen.append(list);
screen.append(consoleWindow);

consoleWindow.hide();

export const askList = (prompt: string, options: [string, string][]) => {

  return new Promise<string>((resolve) => {

    list.show();
    consoleWindow.hide();

    label.setContent("{center}" + prompt + "{/center}");

    list.clearItems();
    list.setItems(options.map((option) => option[0]));

    optionSelected.pipe(take(1)).subscribe((option) => {

      list.hide();
      consoleWindow.show();

      label.setContent("{center}Console{/center}");

      consoleWindow.focus();

      screen.render();

      resolve(options.find(o => o[0] === option)![1]);
    });

    list.focus();

    screen.render();
  });
};

export const log = (text: string) => {
  consoleWindow.pushLine(text);
  screen.render();
};

screen.key(["q", "C-c"], function(ch, key) {
  return process.exit(0);
});

screen.render();

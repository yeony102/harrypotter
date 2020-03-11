# Harry Potter Network
This project text-analyzed the Harry Potter book series and visualized the character relationships and the sentiment in their relationships into graphs.
[Demo](http://yhl438.itp.io:4040/)

### Inspiration
This project is inspired by [Network of Thrones](https://networkofthrones.wordpress.com/), where the authors analyzed the series of Game of Thrones and visualized the importance of its characters and their relationships in graphs.

### What did I visualize?
**Characters & Houses**
A node in a network diagram reprensents a character and its border color represents the house they belong to:
- *Gryffindor: Red* 
- *Hufflepuff: Yellow*
- *Ravenclaw: Blue*
- *Slytherin: Green*
- *N/A: White*

**Importance of Characters** 
The size of a node in a network diagram.
Network diagrams were implemented using the Force-Directed Graph in [D3.js](https://github.com/d3)

**Interaction activeness between two characters**
The length of the edge connecting two nodes in a network diagram.

**Sentiment analysis result between two characters**
The Y-position of a dot in a scatter plot.
Scatter plots were implemented using vanila javascript.

### How did I analyze?

**Importance of Characters**
The total number of times one character's name is called.

**Interaction activeness between two characters**
The number of times one character's name is mentioned within 20 words from the other character's name.

**Sentiment analysis result between two characters**
The sum of the sentiment scores of 20-word long phrases that include both two characters' names.
I did the text-analysis and the sentiment analysis using python + [SpaCy](https://spacy.io/).

### Resources
* Raw text files of Harry Potter series 1 - 7
* [Harry Potter Wiki](http://harrypotter.wikia.com/) for character descriptions
* Google Images for character pictures


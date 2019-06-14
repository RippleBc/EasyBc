const assert = require("assert");
const _ = require("underscore");
const slog = require("single-line-log").stdout;

class FormatResult
{
  constructor(total)
  {
    assert(typeof total === "number", `FormatResult constructor, total should be a Number, now is ${typeof total}`);

    this.total = total || 50;
    this.counts = 0;
    this.contents = [];
  }

  /**
   * @param {Object} content
   *   @prop {String} name
   *   @prop {String} count
   */
  writeContent(content)
  {
    this.contents.push({
      name: content.name,
      count: content.count
    });

    this.counts += content.count;
  }

  printFormatedContent()
  { 
    this.contents = _.sortBy(this.contents, content => {
      return content.count;
    });


    for(let countent of this.contents)
    {
      let formattedContent = '';
      let length = countent.count / this.counts * this.total;
      for(let ele of _.range(length))
      {
        formattedContent += '█';
      }
      formattedContent += `  ${countent.name}  ${countent.count}`
      console.log(`\n${formattedContent}`);
    }
  }
}

module.exports.FormatResult = FormatResult;

class LoadingBar
{
  constructor()
  {
    this.count = 0;
  }

  start()
  {
    this.interval = setInterval(() => {

      let content = '';
      for(let ele of _.range(this.count))
      {
        content += '.'
      }
      slog(content)

      this.count ++;
    }, 500)
  }

  end()
  {
    console.log("\n")
    clearInterval(this.interval);
  }
}

module.exports.LoadingBar = LoadingBar;

class ProgressBar 
{
  /**
   * @param {String} description
   * @param {Number} barLength
   */
  constructor(description, barLength)
  {
    assert(typeof description === 'string', `progress_bar, description should be a String, now is ${typeof description}`);
    if(barLength !== undefined && barLength !== null)
    {
      assert(typeof barLength === 'number', `progress_bar, barLength should be a Number, now is ${typeof barLength}`);
    }
    

    // 两个基本参数(属性)
    this.description = description || 'Progress';
    this.length = barLength || 25;
  }

  /**
   * @param {String} completed
   * @param {Number} total
   */
  render(completed, total){
    assert(typeof completed === 'number', `progress_bar render, completed should be a Number, now is ${typeof completed}`);
    assert(typeof total === 'number', `progress_bar render, total should be a Number, now is ${typeof total}`);

    const percent = (completed / total).toFixed(4);
    const completedNum = Math.floor(percent * this.length);

    // 拼接黑色条
    let cell = '';
    for (let i = 0; i < completedNum; i++) {
      cell += '█';
    }

    // 拼接灰色条
    let empty = '';
    for (let i = 0; i < this.length - completedNum; i++) {
      empty += '░';
    }

    // 拼接最终文本
    let cmdText = this.description + ': ' + (100 * percent).toFixed(2) + '% ' + cell + empty + ' ' + completed + '/' + total;

    // 在单行输出文本
    slog(cmdText);
  }
}

module.exports.ProgressBar = ProgressBar
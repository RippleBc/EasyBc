const slog = require("single-line-log").stdout;
const assert = require("assert");

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

module.exports = ProgressBar
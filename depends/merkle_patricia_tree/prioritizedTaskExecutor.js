const assert = require("assert")

class PrioritizedTaskExecutor 
{
  /**
   * @param {Number} maxPoolSize
   */
  constructor(maxPoolSize) 
  {
    assert(typeof maxPoolSize === 'number', `PrioritizedTaskExecutor constructor, maxPoolSize should be a Number, now is ${typeof maxPoolSize}`);

    this.maxPoolSize = maxPoolSize
    this.currentPoolSize = 0
    this.queue = []
  }

  /**
   * Executes the task.
   * @param {Number} priority The priority of the task
   * @param {Function} task The function that accepts the callback, which must be called upon the task completion.
   */
  execute(priority, task) 
  {
    if(this.currentPoolSize < this.maxPoolSize)
    {
      this.currentPoolSize++

      const taskCallback = () => {
        this.currentPoolSize--
        if(this.queue.length > 0) 
        {
          this.queue.sort((a, b) => b.priority - a.priority)
          const item = this.queue.shift()
          this.execute(item.priority, item.task)
        }
      }

      // task可能是一个异步操作
      task(taskCallback);
    }
    else
    {
      this.queue.push({
        priority: priority,
        task: task
      })
    }
  }
}

module.exports = PrioritizedTaskExecutor
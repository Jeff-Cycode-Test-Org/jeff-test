using System;

namespace HelloWorld
{
  class Program
  {
    static void Main(string[] args)
    {
      if (UnityEngine.Input.GetKeyUp(KeyCode.Space))
        Console.WriteLine("Hello World!");    
    }
  }
}

// Uses Hangulize's Japanese rules and furigana tokenizer, changing only four rules.
package main

import (
	"fmt"
	"os"
	"strings"

	"github.com/hangulize/hangulize"
	"github.com/hangulize/hangulize/translit"
)

func main() {
	if err := run(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func run() error {
	original, ok := hangulize.LoadSpec("jpn")
	if !ok {
		return fmt.Errorf("Hangulize Japanese specification missing")
	}
	source := original.Source
	for _, edit := range [][2]string{
		{`"^k"      -> "g"`, ``},
		{`"^t"      -> "d"`, ``},
		{`"^c{a|i}" -> "z"`, ``},
		{`"cu" -> "쓰"`, `"cu" -> "츠"`},
	} {
		if strings.Count(source, edit[0]) != 1 {
			return fmt.Errorf("Japanese rule mismatch: %s", edit[0])
		}
		source = strings.Replace(source, edit[0], edit[1], 1)
	}
	spec, err := hangulize.ParseSpec(strings.NewReader(source))
	if err != nil {
		return err
	}
	h := hangulize.New(spec)
	translit.Install(h)
	for _, text := range os.Args[1:] {
		result, err := h.Hangulize(text)
		if err != nil {
			return err
		}
		fmt.Println(result)
	}
	return nil
}
